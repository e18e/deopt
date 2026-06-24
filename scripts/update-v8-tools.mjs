#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const V8_TAG = '14.1.146.11';

const FILES = [
  'profile.mjs',
  'codemap.mjs',
  'splaytree.mjs',
  'consarray.mjs',
  'sourcemap.mjs',
  'logreader.mjs',
  'csvparser.mjs',
];

const dirname = path.dirname(fileURLToPath(import.meta.url));
const destDir = path.join(
  dirname,
  '..',
  'packages',
  'processor',
  'lib',
  'vendor',
  'v8-tools',
);

await mkdir(destDir, { recursive: true });

for (const file of FILES) {
  const url = `https://raw.githubusercontent.com/v8/v8/${V8_TAG}/tools/${file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  await writeFile(path.join(destDir, file), await res.text());
  console.log(`vendored tools/${file} @ v8 ${V8_TAG}`);
}
