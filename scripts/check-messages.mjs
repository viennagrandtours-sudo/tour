/**
 * Structural check for messages/*.json:
 * - every locale exposes the same key paths as English
 * - no key contains a dot (next-intl treats "." as a path separator)
 * - no leftover placeholder wording in visitor-facing strings
 */
import { readFileSync } from "node:fs";

const LOCALES = ["en", "de", "es", "it", "ar", "zh", "pt", "tr"];
// Case-sensitive TODO so Spanish "todo" doesn't trip the check.
const PLACEHOLDER = /(placeholder|platzhalter|lorem ipsum|your text here)/i;
const TODO = /\bTODO\b/;

const load = (l) =>
  JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), "utf8"));

function walk(value, path, out) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, `${path}[${i}]`, out));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      walk(child, path ? `${path}.${key}` : key, out);
    }
    return;
  }
  out.set(path, value);
}

const maps = Object.fromEntries(
  LOCALES.map((l) => {
    const out = new Map();
    walk(load(l), "", out);
    return [l, out];
  })
);

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`✗ ${msg}`);
};

const base = [...maps.en.keys()];

for (const locale of LOCALES.slice(1)) {
  const keys = new Set(maps[locale].keys());
  for (const key of base) {
    if (!keys.has(key)) fail(`${locale}: missing key ${key}`);
  }
  for (const key of keys) {
    if (!maps.en.has(key)) fail(`${locale}: extra key ${key}`);
  }
}

for (const locale of LOCALES) {
  for (const [key, value] of maps[locale]) {
    if (key.split(/[.[]/).some((part) => part.includes("."))) {
      fail(`${locale}: dotted key segment in ${key}`);
    }
    if (
      typeof value === "string" &&
      (PLACEHOLDER.test(value) || TODO.test(value)) &&
      !key.startsWith("testimonials._")
    ) {
      fail(`${locale}: placeholder wording in ${key} → ${value.slice(0, 80)}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} problem(s) found.`);
  process.exit(1);
}

console.log(`✓ ${LOCALES.length} locales in sync — ${base.length} keys each, no placeholders.`);
