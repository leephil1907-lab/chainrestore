"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const{normalizeEmail,validateCaseInput,safeNextPath,isAtLeast13}=require("../lib/validation");
test("normalizes email",()=>assert.equal(normalizeEmail(" User@Example.com "),"user@example.com"));
test("rejects malformed email",()=>assert.throws(()=>normalizeEmail("bad-address")));
test("accepts valid incident",()=>assert.equal(validateCaseInput({network:"Ethereum",incident_type:"Unauthorised transfer",details:"An unauthorised transfer occurred from my wallet."}).network,"Ethereum"));
test("rejects wallet secrets",()=>assert.throws(()=>validateCaseInput({network:"Ethereum",incident_type:"Unauthorised transfer",details:"My seed phrase was exposed to a scammer."})));
test("rejects unknown networks",()=>assert.throws(()=>validateCaseInput({network:"Unknown",incident_type:"Unauthorised transfer",details:"A sufficiently long incident description."})));
test("blocks unsafe redirects",()=>{assert.equal(safeNextPath("https://evil.example"),"/account.html");assert.equal(safeNextPath("//evil.example"),"/account.html");assert.equal(safeNextPath("/recovery.html"),"/recovery.html");});

test("server-side age check accepts users who have turned 13",()=>assert.equal(isAtLeast13("2013-11-10",new Date("2026-11-10T12:00:00Z")),true));
test("server-side age check rejects users who have not turned 13",()=>assert.equal(isAtLeast13("2013-11-11",new Date("2026-11-10T12:00:00Z")),false));
test("server-side age check rejects future and invalid dates",()=>{const now=new Date("2026-11-10T12:00:00Z");assert.equal(isAtLeast13("2027-01-01",now),false);assert.equal(isAtLeast13("2013-02-30",now),false);assert.equal(isAtLeast13("not-a-date",now),false);});
