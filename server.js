"use strict";
require("dotenv").config();
const crypto=require("node:crypto");
const path=require("node:path");
const express=require("express");
const helmet=require("helmet");
const {rateLimit}=require("express-rate-limit");
const {Pool}=require("pg");
const {normalizeEmail,validateCaseInput}=require("./lib/validation");
for(const key of ["SESSION_SECRET","OTP_SECRET"])if(process.env.NODE_ENV==="production"&&(!process.env[key]||process.env[key].length<32))throw new Error(key+" must be at least 32 characters.");
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required.");
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:false}:undefined,max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:10000});
const app=express();app.disable("x-powered-by");app.set("trust proxy",1);
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'","data:"],connectSrc:["'self'"],objectSrc:["'none'"],baseUri:["'self'"],frameAncestors:["'none'"],formAction:["'self'"]}}}));
app.use(express.json({limit:"32kb"}));
app.use((req,res,next)=>{if(req.path.startsWith("/api/"))res.set("Cache-Control","no-store");if(["POST","PUT","PATCH","DELETE"].includes(req.method)){const origin=req.get("origin");if(origin){try{if(new URL(origin).host!==req.get("host"))return res.status(403).json({error:"Cross-origin request blocked."});}catch(_){return res.status(403).json({error:"Invalid request origin."});}}}next();});
app.use(express.static(path.join(__dirname,"public"),{index:"index.html",maxAge:process.env.NODE_ENV==="production"?"1h":0}));
const authLimiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:"draft-8",legacyHeaders:false,message:{error:"Too many sign-in attempts. Try again later."}});
const caseLimiter=rateLimit({windowMs:60*60*1000,limit:20,standardHeaders:"draft-8",legacyHeaders:false});
const COOKIE="cr_session",SESSION_MS=30*24*60*60*1000;
const otpSecret=process.env.OTP_SECRET||"development-otp-secret-change-me",sessionSecret=process.env.SESSION_SECRET||"development-session-secret-change-me";
const hmac=(value,secret)=>crypto.createHmac("sha256",secret).update(value).digest("hex");
const sessionHash=token=>hmac(token,sessionSecret);
const cookieOptions=maxAge=>({httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge});
app.use((req,_res,next)=>{const raw=req.headers.cookie||"";req.cookies=Object.fromEntries(raw.split(";").map(x=>x.trim()).filter(Boolean).map(part=>{const i=part.indexOf("=");return[decodeURIComponent(part.slice(0,i)),decodeURIComponent(part.slice(i+1))];}));next();});
async function sendCode(email,code){
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)throw new Error("Email delivery is not configured.");
 const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[email],subject:"Your ChainRestore sign-in code",text:"Your ChainRestore sign-in code is "+code+". It expires in 10 minutes. Never share this code.",html:"<div style=\"font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#14212a\"><h2>ChainRestore sign-in</h2><p>Your one-time sign-in code is:</p><p style=\"font-size:32px;font-weight:700;letter-spacing:8px\">"+code+"</p><p>This code expires in 10 minutes. Never share it.</p></div>"})});
 if(!r.ok)throw new Error("Email provider rejected the message: "+(await r.text()).slice(0,250));
}
app.get("/healthz",async(_req,res)=>{try{await pool.query("SELECT 1");res.json({ok:true,service:"chainrestore"});}catch(_){res.status(503).json({ok:false,service:"chainrestore"});}});
app.get("/login",(_req,res)=>res.sendFile(path.join(__dirname,"public","login.html")));
app.get("/account",(_req,res)=>res.sendFile(path.join(__dirname,"public","account.html")));
app.post("/api/auth/request-code",authLimiter,async(req,res)=>{
 let email;try{email=normalizeEmail(req.body&&req.body.email);}catch(e){return res.status(400).json({error:e.message});}
 try{
  const recent=await pool.query("SELECT count(*)::int AS n FROM login_codes WHERE email=$1 AND created_at>now()-interval '15 minutes'",[email]);
  if(recent.rows[0].n>=5)return res.status(429).json({error:"Too many codes requested for this address. Try again later."});
  const code=String(crypto.randomInt(0,1000000)).padStart(6,"0"),hash=hmac(email+":"+code,otpSecret);
  await pool.query("UPDATE login_codes SET consumed_at=now() WHERE email=$1 AND consumed_at IS NULL",[email]);
  await pool.query("INSERT INTO login_codes(email,code_hash,expires_at) VALUES($1,$2,now()+interval '10 minutes')",[email,hash]);
  try{await sendCode(email,code);}catch(e){await pool.query("UPDATE login_codes SET consumed_at=now() WHERE email=$1 AND consumed_at IS NULL",[email]);throw e;}
  res.json({ok:true,message:"A one-time sign-in code has been sent."});
 }catch(e){console.error("auth_request_failed",e.message);res.status(503).json({error:"Sign-in email could not be sent. Please try again later."});}
});
app.post("/api/auth/verify-code",authLimiter,async(req,res)=>{
 let email;try{email=normalizeEmail(req.body&&req.body.email);}catch(e){return res.status(400).json({error:e.message});}
 const code=String(req.body&&req.body.code||"").trim();if(!/^\d{6}$/.test(code))return res.status(400).json({error:"Enter the six-digit code."});
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  const q=await client.query("SELECT id,code_hash,expires_at,attempts FROM login_codes WHERE email=$1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1 FOR UPDATE",[email]),row=q.rows[0];
  if(!row||new Date(row.expires_at)<new Date()||row.attempts>=5){await client.query("ROLLBACK");return res.status(400).json({error:"The code is invalid or expired. Request a new one."});}
  const expected=Buffer.from(row.code_hash,"hex"),actual=Buffer.from(hmac(email+":"+code,otpSecret),"hex");
  if(expected.length!==actual.length||!crypto.timingSafeEqual(expected,actual)){await client.query("UPDATE login_codes SET attempts=attempts+1 WHERE id=$1",[row.id]);await client.query("COMMIT");return res.status(400).json({error:"The code is incorrect. Check it and try again."});}
  await client.query("UPDATE login_codes SET consumed_at=now() WHERE id=$1",[row.id]);
  const u=await client.query("INSERT INTO users(email,email_verified_at) VALUES($1,now()) ON CONFLICT(email) DO UPDATE SET email_verified_at=COALESCE(users.email_verified_at,now()),updated_at=now() RETURNING id,email",[email]);
  const user=u.rows[0],token=crypto.randomBytes(32).toString("base64url");
  await client.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 days')",[sessionHash(token),user.id]);
  await client.query("COMMIT");res.cookie(COOKIE,token,cookieOptions(SESSION_MS));res.json({ok:true,user});
 }catch(e){await client.query("ROLLBACK");console.error("auth_verify_failed",e.message);res.status(500).json({error:"Sign-in could not be completed. Try again."});}finally{client.release();}
});
async function requireAuth(req,res,next){
 const token=req.cookies[COOKIE];if(!token||token.length<32)return res.status(401).json({error:"Sign in is required."});
 try{const q=await pool.query("SELECT u.id,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()",[sessionHash(token)]);if(!q.rowCount)return res.status(401).json({error:"Your session has expired. Sign in again."});req.user=q.rows[0];next();}
 catch(e){console.error("session_lookup_failed",e.message);res.status(503).json({error:"Account service is temporarily unavailable."});}
}
app.get("/api/auth/me",requireAuth,(req,res)=>res.json({user:req.user}));
app.post("/api/auth/logout",requireAuth,async(req,res)=>{await pool.query("DELETE FROM sessions WHERE token_hash=$1",[sessionHash(req.cookies[COOKIE])]);res.clearCookie(COOKIE,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/"});res.json({ok:true});});
async function withUserTransaction(userId,fn){const client=await pool.connect();try{await client.query("BEGIN");await client.query("SELECT set_config('app.current_user_id',$1,true)",[userId]);const result=await fn(client);await client.query("COMMIT");return result;}catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}}
app.get("/api/cases/list",requireAuth,async(req,res)=>{try{const q=await withUserTransaction(req.user.id,c=>c.query("SELECT id,network,incident_type,public_reference,incident_date,status,created_at FROM case_reports WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50",[req.user.id]));res.json({cases:q.rows});}catch(e){console.error("case_list_failed",e.message);res.status(500).json({error:"Could not load your incident records."});}});
app.post("/api/cases/create",requireAuth,caseLimiter,async(req,res)=>{let data;try{data=validateCaseInput(req.body);}catch(e){return res.status(400).json({error:e.message});}try{const q=await withUserTransaction(req.user.id,c=>c.query("INSERT INTO case_reports(user_id,network,incident_type,public_reference,incident_date,details) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,status,created_at",[req.user.id,data.network,data.incidentType,data.reference,data.incidentDate,data.details]));res.status(201).json({ok:true,case:q.rows[0]});}catch(e){console.error("case_create_failed",e.message);res.status(500).json({error:"Your case could not be saved. Try again."});}});
app.use((_req,res)=>res.status(404).json({error:"Not found."}));
app.use((err,_req,res,_next)=>{console.error("request_failed",err.message);res.status(500).json({error:"An unexpected server error occurred."});});
const server=app.listen(Number(process.env.PORT||10000),"0.0.0.0",()=>process.stdout.write("ChainRestore listening.\n"));
async function shutdown(){server.close(async()=>{await pool.end();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();}
process.on("SIGTERM",shutdown);process.on("SIGINT",shutdown);
