#!/usr/bin/env node
/* Checks that every user-visible English string has an Indonesian entry
   in i18n.js. No dependencies: `node tools/check-i18n.js`.
   - static text, placeholder, title and aria-label in index.html
   - string literals passed to T(), toast() and this.toast() in app.js
   Exits with code 1 when something is missing. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

// Load the dictionary without a browser.
const sandbox = {
  window: {},
  document: { readyState: "complete", addEventListener() {}, documentElement: {}, querySelectorAll: () => [], body: null, dispatchEvent() {} },
  navigator: { languages: ["en"] },
  localStorage: { getItem: () => null, setItem() {} },
  CustomEvent: function () {},
  NodeFilter: {},
};
vm.createContext(sandbox);
try {
  vm.runInContext(read("i18n.js"), sandbox);
} catch {}
const dict = sandbox.window.I18n?.dict || {};
const norm = (s) => String(s).replace(/\s+/g, " ").trim();
const ignore = (s) => !s || !/[a-zA-Z]{2}/.test(s) || /^(ARIA XD7|Aria XD7|Eben|EN|ID|ms|#|DPI|OK|FAIL|\d+ mm)$/.test(s) || /^[\d\s·.:%x×—-]+$/.test(s);

const missing = new Map();
const need = (s, where) => {
  const k = norm(s);
  if (ignore(k) || k in dict) return;
  if (!missing.has(k)) missing.set(k, where);
};

// index.html
let html = read("index.html")
  .replace(/<script[\s\S]*?<\/script>/g, "")
  .replace(/<style[\s\S]*?<\/style>/g, "")
  .replace(/<pre[\s\S]*?<\/pre>/g, "")
  .replace(/<!--[\s\S]*?-->/g, "");
for (const m of html.matchAll(/\b(?:placeholder|title|aria-label)="([^"]+)"/g)) need(m[1].replace(/&amp;/g, "&"), "index.html attr");
html = html.replace(/<code>[\s\S]*?<\/code>/g, "<br>").replace(/<[^>]*data-no-i18n[^>]*>[^<]*</g, "<");
for (const m of html.matchAll(/>([^<>]+)</g)) {
  const t = m[1].replace(/&amp;/g, "&").replace(/&#9829;|&lt;|&gt;|&times;/g, " ");
  need(t, "index.html text");
}

// JS literals
for (const f of ["app.js"]) {
  const src = read(f);
  const re = /(?:\bT|\btoast)\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
  for (const m of src.matchAll(re)) {
    if (m[1] === "`" && m[2].includes("${")) continue;
    need(m[2].replace(/\\"/g, '"').replace(/\\n/g, "\n"), f);
  }
}

if (missing.size) {
  console.log(`Missing ${missing.size} Indonesian translation(s):`);
  for (const [k, w] of missing) console.log(`  [${w}] ${JSON.stringify(k)}`);
  process.exit(1);
}
console.log(`i18n OK — ${Object.keys(dict).length} entries, nothing missing.`);
