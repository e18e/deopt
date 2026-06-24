import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { mkdir, stat } from 'node:fs/promises'
import { styleText } from 'node:util'

function determineArgs(args) {
  const __index = args.indexOf('--')
  if (__index < 0) {
    return { argv: args, extraExecArgv: [] }
  }
  // For now we ignore any args before the -- as those would be for deoptigate
  // At this point deoptigate doesn't consume any flags
  const afterDashes = args.slice(__index + 1)

  const first = afterDashes[0]
  if (first == null) return { execArgv: [] }

  if (first[0] === '-') {
    throw Error(
      `The node binary must immediately follow the double dash (--)
  deoptigate -- node [nodeFlags] script.js [scriptFlags]
    `)
  }
  const afterDashesArgs = afterDashes.slice(1)

  // Piece together execArgv and argv in cases as
  // deoptigate -- node --allow-natives-syntax app.js --log
  // to be: [ --allow-natives-syntax ] and [ app.js, --log ]
  // Not super important as ispawn concatentates them anyways, but for correctness
  const extraExecArgv = []
  const argv = []
  let sawApp = false

  for (const arg of afterDashesArgs) {
    if (sawApp) argv.push(arg)
    if (!arg.startsWith('-')) {
      sawApp = true
      argv.push(arg)
      continue
    }
    extraExecArgv.push(arg)
  }

  return (
    first === 'node'
    ? { argv, extraExecArgv }
    : { argv, extraExecArgv, nodeExecutable: first }
  )
}

function runNode({ node = process.execPath, execArgv, argv }) {
  const child = spawn(node, execArgv.concat(argv), { stdio: 'inherit' })

  const termination = new Promise(resolve => {
    let interrupted = false

    process.once('SIGINT', () => {
      interrupted = true
      console.log(styleText('gray', '\nshutting down...'))
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 500).unref()
    })
    child.once('exit', code => resolve(interrupted ? null : code))
  })

  return termination
}

async function createDirIfMissing(dir) {
  try {
    await mkdir(dir, { recursive: true })
  } catch (err) {
    // mkdir refuses if the path already exists as a non-directory
    const statInfo = await stat(dir).catch(() => null)
    if (statInfo != null && !statInfo.isDirectory()) {
      throw new Error(`Found ${dir}, but it wasn't a directory, please remove it.`)
    }
    throw err
  }
}

export async function createLog(args, head, simpleHead) {
  const { extraExecArgv, argv,  nodeExecutable } = determineArgs(args)

  const logDir = `${tmpdir()}/deoptigate`
  await createDirIfMissing(logDir)

  const logFile = `${tmpdir()}/deoptigate/v8.log`

  const execArgv = [
      '--log-ic'
    , '--log-deopt'
    , '--log-code'
    , `--logfile=${logFile}`
    , '--no-logfile-per-isolate'
  ].concat(extraExecArgv)

  const spawnArgs = { execArgv, argv }
  if (nodeExecutable != null) spawnArgs.node = nodeExecutable

  const code = await runNode(spawnArgs)
  const terminationMsg = (code == null
    ? 'process was interrupted'
    : 'process completed with code ' + code
  )
  console.log(`\n${head} ${styleText('gray', terminationMsg)}`)
  console.log(`${simpleHead} ${styleText('gray', 'logfile written to ' + logFile)}`)
  return logFile
}
