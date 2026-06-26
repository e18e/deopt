import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename } from 'node:path';
import { mkdir, stat } from 'node:fs/promises';
import { styleText } from 'node:util';

// Runtimes that accept the V8 logging flags we rely on. When the command leads
// with one of these it's treated as the executable rather than the script.
const runtimes = new Set(['node', 'd8']);

interface DeterminedArgs {
  argv: string[];
  extraExecArgv: string[];
  nodeExecutable?: string;
}

interface RunNodeOptions {
  node?: string;
  execArgv: string[];
  argv: string[];
}

function determineArgs(tokens: string[]): DeterminedArgs {
  const first = tokens[0];
  const hasRuntime = first !== undefined && runtimes.has(basename(first));

  const executable = hasRuntime ? first : undefined;
  const rest = hasRuntime ? tokens.slice(1) : tokens;

  // Split runtime flags from the script and its arguments, e.g.
  // node --allow-natives-syntax app.js --log
  // becomes execArgv: [ --allow-natives-syntax ] and argv: [ app.js, --log ]
  const extraExecArgv: string[] = [];
  const argv: string[] = [];
  let sawApp = false;
  for (const arg of rest) {
    if (sawApp) {
      argv.push(arg);
    } else if (arg.startsWith('-')) {
      extraExecArgv.push(arg);
    } else {
      sawApp = true;
      argv.push(arg);
    }
  }

  const result: DeterminedArgs = { argv, extraExecArgv };
  // A bare `node` uses the current process executable; an explicit path or d8
  // is spawned as given.
  if (executable !== undefined && executable !== 'node') {
    result.nodeExecutable = executable;
  }
  return result;
}

function runNode({
  node = process.execPath,
  execArgv,
  argv,
}: RunNodeOptions): Promise<number | null> {
  const child = spawn(node, execArgv.concat(argv), { stdio: 'inherit' });

  const termination = new Promise<number | null>((resolve) => {
    let interrupted = false;

    process.once('SIGINT', () => {
      interrupted = true;
      console.log(styleText('gray', '\nshutting down...'));
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 500).unref();
    });
    child.once('exit', (code) => resolve(interrupted ? null : code));
  });

  return termination;
}

async function createDirIfMissing(dir: string): Promise<void> {
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    // mkdir refuses if the path already exists as a non-directory
    const statInfo = await stat(dir).catch(() => null);
    if (statInfo !== null && !statInfo.isDirectory()) {
      throw new Error(
        `Found ${dir}, but it wasn't a directory, please remove it.`,
        { cause: err },
      );
    }
    throw err;
  }
}

export async function createLog(
  args: string[],
  head: string,
  simpleHead: string,
): Promise<string> {
  const { extraExecArgv, argv, nodeExecutable } = determineArgs(args);

  const logDir = `${tmpdir()}/e18e-deopt`;
  await createDirIfMissing(logDir);

  const logFile = `${tmpdir()}/e18e-deopt/v8.log`;

  const execArgv = [
    '--log-ic',
    '--log-deopt',
    '--log-code',
    `--logfile=${logFile}`,
    '--no-logfile-per-isolate',
  ].concat(extraExecArgv);

  const spawnArgs: RunNodeOptions = { execArgv, argv };
  if (nodeExecutable !== undefined) spawnArgs.node = nodeExecutable;

  const code = await runNode(spawnArgs);
  if (code !== 0) {
    console.error(
      `${head} ${styleText(
        'red',
        `process exited with code ${code}, logfile may be incomplete`,
      )}`,
    );
  }
  console.log(
    `${simpleHead} ${styleText('gray', 'logfile written to ' + logFile)}`,
  );
  return logFile;
}
