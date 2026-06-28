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
      --md       Print a concise markdown report to stdout instead of opening
                 the visualization in a browser
`;

const args = process.argv.slice(2);
const dashIndex = args.indexOf('--');

// deopt's own options precede the command to run. With a `--` separator they
// are taken from before it; otherwise they are the leading flags up to the
// first non-flag token (the runtime, script or log file).
let optionArgs: string[];
let command: string[];
if (dashIndex < 0) {
  let i = 0;
  while (i < args.length && args[i].startsWith('-')) i++;
  optionArgs = args.slice(0, i);
  command = args.slice(i);
} else {
  optionArgs = args.slice(0, dashIndex);
  command = args.slice(dashIndex + 1);
}

const { values } = parseArgs({
  args: optionArgs,
  options: {
    help: { type: 'boolean', short: 'h' },
    md: { type: 'boolean' },
  },
});

const userNeedsHelp = values.help || command.length === 0;

try {
  if (userNeedsHelp) {
    console.log(usage);
  } else if (command.length === 1 && command[0].endsWith('.log')) {
    await openLog(command[0], happyHead, { md: values.md });
  } else {
    const log = await createLog(command, happyHead, simpleHead, {
      md: values.md,
    });
    await openLog(log, happyHead, { md: values.md });
  }
} catch (err) {
  console.error(`${errorHead}: ${String(err)}`);
  process.exitCode = 1;
}
