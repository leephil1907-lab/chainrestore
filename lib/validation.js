"use strict";
const NETWORKS=new Set(["Bitcoin","Ethereum","BNB Chain","Solana","TRON","XRP Ledger","Polygon","Avalanche","Other"]);
const TYPES=new Set(["Unauthorised transfer","Investment or impersonation scam","Exchange account compromise","Phishing or malicious approval","Other / unsure"]);
function normalizeEmail(value){const email=String(value||"").trim().toLowerCase();if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Enter a valid email address.");return email;}
function isAtLeast13(value,now=new Date()){
 const match=String(value||"").match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);if(!match)return false;
 const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
 const birth=new Date(Date.UTC(year,month-1,day));
 if(birth.getUTCFullYear()!==year||birth.getUTCMonth()!==month-1||birth.getUTCDate()!==day||birth>now)return false;
 let age=now.getUTCFullYear()-year;if(now.getUTCMonth()+1<month||(now.getUTCMonth()+1===month&&now.getUTCDate()<day))age--;
 return age>=13;
}
function validateCaseInput(body={}){const network=String(body.network||"").trim(),incidentType=String(body.incident_type||"").trim(),reference=String(body.public_reference||"").trim(),incidentDate=body.incident_date?String(body.incident_date).slice(0,10):null,details=String(body.details||"").trim();if(!NETWORKS.has(network)||!TYPES.has(incidentType)||details.length<12||details.length>5000)throw new Error("Please provide a valid network, incident type and 12–5000 characters of incident detail.");if(reference.length>180)throw new Error("The public reference must be 180 characters or fewer.");if(incidentDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(incidentDate)||Number.isNaN(Date.parse(incidentDate))))throw new Error("The incident date is invalid.");if(/seed phrase|private key|recovery phrase|password/i.test(details))throw new Error("Remove wallet secrets or passwords. Public transaction references are sufficient.");return{network,incidentType,reference:reference||null,incidentDate,details};}
function safeNextPath(value){const path=String(value||"/account.html");return path.startsWith("/")&&!path.startsWith("//")&&!path.includes("\\")?path:"/account.html";}
module.exports={normalizeEmail,validateCaseInput,safeNextPath,isAtLeast13};
