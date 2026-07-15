import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

const SRC = './src';
const EXTS = new Set(['.jsx', '.js', '.tsx', '.ts', '.css']);

// Exact color replacements: blue → monochrome
const REPLACEMENTS = [
  // Hex cobalt variants
  [/#3B5BDB/gi,  '#111318'],
  [/#3b5bdb/gi,  '#111318'],
  [/#2F4AC0/gi,  '#374151'],
  [/#2f4ac0/gi,  '#374151'],
  [/#EEF2FF/gi,  '#F3F4F6'],
  [/#eef2ff/gi,  '#F3F4F6'],
  [/#E0E7FF/gi,  '#E5E7EB'],
  [/#e0e7ff/gi,  '#E5E7EB'],
  // RGBA cobalt
  [/rgba\(59,\s*91,\s*219,\s*0\.12\)/gi, 'rgba(17,19,24,0.12)'],
  [/rgba\(59,\s*91,\s*219,\s*0\.1\)/gi,  'rgba(17,19,24,0.10)'],
  [/rgba\(59,\s*91,\s*219,\s*0\.08\)/gi, 'rgba(17,19,24,0.08)'],
  [/rgba\(59,91,219,0\.12\)/gi,           'rgba(17,19,24,0.12)'],
  [/rgba\(59,91,219,0\.1\)/gi,            'rgba(17,19,24,0.10)'],
  // Tailwind blue / indigo classes that are interactive accents
  [/\bbg-\[#3B5BDB\]/g,   'bg-[#111318]'],
  [/\bbg-\[#2F4AC0\]/g,   'bg-[#374151]'],
  [/\bhover:bg-\[#2F4AC0\]/g, 'hover:bg-[#374151]'],
  [/\bhover:bg-\[#3B5BDB\]/g, 'hover:bg-[#111318]'],
  [/\btext-\[#3B5BDB\]/g, 'text-[#111318]'],
  [/\bborder-\[#3B5BDB\]/g, 'border-[#111318]'],
  // Tailwind indigo / blue color classes used as primary accent
  [/\btext-indigo-600\b/g, 'text-zinc-900'],
  [/\btext-indigo-500\b/g, 'text-zinc-800'],
  [/\bbg-indigo-600\b/g,   'bg-zinc-900'],
  [/\bbg-indigo-50\b/g,    'bg-zinc-50'],
  [/\bborder-indigo-100\b/g, 'border-zinc-200'],
  [/\bfocus:ring-indigo-500\b/g, 'focus:ring-zinc-900'],
  [/\btext-blue-600\b/g,   'text-zinc-900'],
  [/\bbg-blue-50\b/g,      'bg-zinc-50'],
  [/\bborder-blue-100\b/g, 'border-zinc-200'],
  // focus:border-indigo / focus:ring-indigo
  [/\bfocus:border-indigo-\d+\b/g, 'focus:border-zinc-900'],
  [/\bfocus:ring-indigo-\d+\b/g,   'focus:ring-zinc-900'],
];

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else if (EXTS.has(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

let changed = 0;
for (const file of walk(SRC)) {
  let content = readFileSync(file, 'utf8');
  const original = content;
  for (const [pattern, replacement] of REPLACEMENTS) {
    content = content.replace(pattern, replacement);
  }
  if (content !== original) {
    writeFileSync(file, content, 'utf8');
    console.log('✓', file.replace('./src/', ''));
    changed++;
  }
}
console.log(`\nDone — ${changed} file(s) updated.`);
