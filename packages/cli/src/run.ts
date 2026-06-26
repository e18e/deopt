import { styleText, parseArgs } from 'node:util';

import { openLog } from './open-log.js';
import { createLog } from './create-log.js';

const simpleHead = styleText('blue', '@e18e/deopt');
const happyHead = styleText('blue', '@e18e/deopt ⚡');
const errorHead = styleText('red', '@e18e/deopt 🚫');

const usage = `${simpleHead} - investigate v8/Node.js deoptimizations

Usage:
  npx @e18e/deopt <command...>
  npx @e18e/deopt <deopt options> -- <command...>
  npx @e18e/deopt <file.log>

Run a script and open the deoptimization visualization:
  npx @e18e/deopt app.js
  npx @e18e/deopt app.js --app-flag
  npx @e18e/deopt node --allow-natives-syntax app.js
  npx @e18e/deopt /path/to/node app.js
  npx @e18e/deopt d8 app.js

Open an existing v8 log:
  npx @e18e/deopt v8.log

Options:
  -h, --help     Show this help text
`;

const args = process.argv.slice(2);
const dashIndex = args.indexOf('--');

// Without `--` the whole argument list is the command to run. deopt's own
// options are only accepted before a `--` separator.
let values: { help?: boolean } = {};
let command: string[];
if (dashIndex < 0) {
  command = args;
} else {
  ({ values } = parseArgs({
    args: args.slice(0, dashIndex),
    options: {
      help: { type: 'boolean', short: 'h' },
    },
  }));
  command = args.slice(dashIndex + 1);
}

const userNeedsHelp =
  values.help ||
  (dashIndex < 0 &&
    (command.length === 0 || command[0] === '--help' || command[0] === '-h'));

try {
  if (userNeedsHelp) {
    console.log(usage);
  } else if (command.length === 1 && command[0].endsWith('.log')) {
    await openLog(command[0], happyHead);
  } else {
    const log = await createLog(command, happyHead, simpleHead);
    await openLog(log, happyHead);
  }
} catch (err) {
  console.error(`${errorHead}: ${String(err)}`);
  process.exitCode = 1;
}
