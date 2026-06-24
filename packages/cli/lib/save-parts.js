import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tmpdir = os.tmpdir();
const workDir = path.join(tmpdir, 'e18e-deopt');

export function saveData(json) {
  fs.mkdirSync(workDir, { recursive: true });
  const dest = path.join(workDir, 'data.json');
  fs.writeFileSync(dest, json, 'utf8');
  return dest;
}
