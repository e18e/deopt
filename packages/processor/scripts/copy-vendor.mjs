#!/usr/bin/env node

import { cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(dirname, '..', 'src', 'vendor');
const destDir = path.join(dirname, '..', 'lib', 'vendor');

await cp(srcDir, destDir, { recursive: true });
console.log('copied src/vendor -> lib/vendor');
