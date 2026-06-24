import { styleText } from 'node:util';

import { openLog } from './open-log.js';
import { findLog } from './find-log.js';
import { createLog } from './create-log.js';

const simpleHead = styleText('blue', '@e18e/deopt');
const happyHead = styleText('blue', '@e18e/deopt 💪');
const errorHead = styleText('red', '@e18e/deopt 🚫');

try {
  const log =
    process.argv.length <= 2
      ? await findLog(happyHead)
      : await createLog(process.argv.slice(2), happyHead, simpleHead);
  await openLog(log, happyHead);
} catch (err) {
  console.error(`${errorHead}: ${err}`);
}
