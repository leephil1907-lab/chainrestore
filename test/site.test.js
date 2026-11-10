"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const publicDir = path.join(__dirname, "..", "public");
const htmlFiles = fs.readdirSync(publicDir).filter(file => file.endsWith(".html"));
const html = Object.fromEntries(htmlFiles.map(file => [file, fs.readFileSync(path.join(publicDir, file), "utf8")]));

function localTarget(url) {
  const pathname = new URL(url, "https://chainrestore.test").pathname;
  if (pathname === "/") return "index.html";
  if (pathname === "/login") return "login.html";
  if (pathname === "/account") return "account.html";
  return pathname.replace(/^\//, "");
}

test("all public pages include mobile viewport and shared design stylesheet", () => {
  for (const [file, source] of Object.entries(html)) {
    assert.match(source, /name=["']viewport["']/i, file + " is missing its viewport meta");
    assert.match(source, /href=["']\/theme\.css["']/i, file + " is missing theme.css");
  }
});

test("all non-login pages expose the shared responsive navigation", () => {
  for (const [file, source] of Object.entries(html)) {
    if (file === "login.html") continue;
    assert.match(source, /class=["']nav-links["']/i, file + " is missing navigation");
    assert.match(source, /class=["']menu-btn["']/i, file + " is missing its mobile menu control");
    assert.match(source, /id=["']primary-navigation["']/i, file + " is missing the navigation target");
  }
});

test("all local page and asset references resolve inside public", () => {
  for (const [file, source] of Object.entries(html)) {
    const refs = [...source.matchAll(/(?:href|src)=["'](\/[^"']*)["']/gi)];
    for (const match of refs) {
      const ref = match[1];
      if (ref.startsWith("//") || ref.startsWith("/api/")) continue;
      const target = path.join(publicDir, localTarget(ref));
      assert.ok(fs.existsSync(target), file + " references missing local path " + ref);
    }
  }
});

test("every HTML image has alternative text and the home illustration exists", () => {
  for (const [file, source] of Object.entries(html)) {
    assert.doesNotMatch(source, /<img\b(?![^>]*\balt=)[^>]*>/i, file + " contains an image without alt text");
  }
  assert.ok(fs.existsSync(path.join(publicDir, "chain-network.svg")));
  assert.match(html["index.html"], /src=["']\/chain-network\.svg["']/);
});

test("login, recovery and account forms retain their required controls", () => {
  for (const id of ["agePanel", "birthDate", "ageContinue", "ageBlocked", "form", "email", "code", "submit", "back", "msg"]) {
    assert.match(html["login.html"], new RegExp('id=["']' + id + '["']'), "login.html missing " + id);
  }
  for (const id of ["caseForm", "network", "type", "tx", "date", "details", "caseMsg"]) {
    assert.match(html["recovery.html"], new RegExp('id=["']' + id + '["']'), "recovery.html missing " + id);
  }
  for (const id of ["welcome", "cases", "signout"]) {
    assert.match(html["account.html"], new RegExp('id=["']' + id + '["']'), "account.html missing " + id);
  }
});

test("shared stylesheet defines real layout primitives and mobile breakpoints", () => {
  const css = fs.readFileSync(path.join(publicDir, "theme.css"), "utf8");
  for (const selector of ["body{", ".wrap{", ".nav-inner{", ".nav-links{", ".hero{", ".grid3{", ".split{", ".footer-inner{"]) {
    assert.ok(css.includes(selector), "theme.css is missing " + selector);
  }
  assert.match(css, /@media\(max-width:1100px\)/);
  assert.match(css, /@media\(max-width:640px\)/);
  assert.match(css, /@media\(max-width:380px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
