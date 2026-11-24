// SPDX-License-Identifier: MIT
// Angry Judge: The Short Rant Contest — main.ts (Node 22)
// Writes one original short funny rant about an everyday annoyance
// (the office printer) to /output/entry.txt (or $MAKEFUN_OUTPUT_DIR/entry.txt),
// deterministically. Gate: UTF-8 text, 1-400 characters, not only whitespace.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RANT =
  "Our office printer has one job. It jams on page one, prints page two in a language I do not speak, then flashes PC LOAD LETTER like that is a real sentence. I have opened every tray, whispered to it, restarted it how IT told me to. It works fine for everyone else. It hates me personally, and honestly, fair. I would hate me too if my whole job was printing Dave's 40-page deck about synergy.";

function gate(line: string): void {
  const chars = [...line].length;
  if (chars < 1 || chars > 400) {
    throw new Error(`entry must be 1-400 characters, got ${chars}`);
  }
  if (line !== line.trim()) {
    throw new Error("entry must not have leading or trailing whitespace");
  }
  for (const ch of line) {
    const code = ch.codePointAt(0) as number;
    if (code < 0x20 || code === 0x7f) {
      throw new Error("entry must not contain control characters");
    }
  }
  if (line.includes("\n") || line.includes("\r")) {
    throw new Error("entry must be a single line");
  }
  if (line.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
  // A rant, not a fragment: at least two sentences, each ending on a
  // sentence terminator, so the piece has room to escalate and land.
  const sentences = line.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) {
    throw new Error("entry must contain at least two sentences");
  }
  for (const s of sentences) {
    if (!/[.!?]$/.test(s)) {
      throw new Error("every sentence must end on a terminator");
    }
  }
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
gate(RANT);
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, RANT, "utf8");

// Read back with strict UTF-8 decoding and verify byte-for-byte: what we
// wrote is what the judge gets. TextDecoder with fatal:true makes invalid
// bytes fail instead of being silently replaced by readFileSync's utf8
// decoding, so a corrupt entry.txt can never pass silently.
const raw = readFileSync(outPath);
const back = new TextDecoder("utf-8", { fatal: true }).decode(raw);
if (back !== RANT) {
  throw new Error("read-back mismatch: entry.txt does not match the rant");
}
// Byte-level check: the file's raw bytes must be exactly the UTF-8
// encoding of the rant, so no BOM, newline, or stray byte can sneak in.
const expected = new TextEncoder().encode(RANT);
if (raw.length !== expected.length || !raw.every((b, i) => b === expected[i])) {
  throw new Error("byte mismatch: entry.txt bytes differ from the rant");
}
console.log(`wrote ${[...RANT].length} chars to ${outPath}`);
