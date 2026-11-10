"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const{normalizeEmail,validateCaseInput,safeNextPath}=require("../lib/validation");
test("normalizes email",()=>assert.equal(normalizeEmail(" User@Example.com "),"user@example.com"));
test("rejects malformed email",()=>assert.throws(()=>normalizeEmail("bad-address")));
test("accepts valid incident",()=>assert.equal(validateCaseInput({network:"Ethereum",incident_type:"Unauthorised transfer",details:"An unauthorised transfer occurred from my wallet."}).network,"Ethereum"));
test("rejects wallet secrets",()=>assert.throws(()=>validateCaseInput({network:"Ethereum",incident_type:"Unauthorised transfer",details:"My seed phrase was exposed to a scammer."})));
test("rejects unknown networks",()=>assert.throws(()=>validateCaseInput({network:"Unknown",incident_type:"Unauthorised transfer",details:"A sufficiently long incident description."})));
test("blocks unsafe redirects",()=>{assert.equal(safeNextPath("https://evil.example"),"/account.html");assert.equal(safeNextPath("//evil.example"),"/account.html");assert.equal(safeNextPath("/recovery.html"),"/recovery.html");});
