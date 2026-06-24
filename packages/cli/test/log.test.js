import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { groupByFileAndLocation } from '../lib/grouping/group-by-file-and-location.js'
import { processLog } from '../lib/log.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.join(__dirname, '..')
const repoRoot = path.join(packageRoot, '../..')

async function groupedLog(scriptPath, { icStateChangesOnly = true } = {}) {
  const logDir = await mkdtemp(path.join(tmpdir(), 'deopt-test-'))
  const logFile = path.join(logDir, 'v8.log')

  try {
    await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          '--log-ic',
          '--log-deopt',
          '--log-code',
          '--no-logfile-per-isolate',
          `--logfile=${logFile}`,
          scriptPath,
        ],
        { stdio: 'ignore' }
      )
      child.once('error', reject)
      child.once('exit', code =>
        code === 0 ? resolve() : reject(new Error(`script exited with ${code}`))
      )
    })

    const groupedByFile = await processLog(logFile, { icStateChangesOnly })
    return groupByFileAndLocation(groupedByFile)
  } finally {
    await rm(logDir, { recursive: true, force: true })
  }
}

test('simple/adders.js', async () => {
  const addersSrcFile = path.join(repoRoot, 'examples/simple/adders.js')

  const result = await groupedLog(addersSrcFile)
  assert.equal(result.size, 1, 'number of files')

  const fileData = result.get(addersSrcFile)
  const fileSrc = await readFile(addersSrcFile, 'utf8')
  assert.equal(fileData.fullPath, addersSrcFile, 'fullPath')
  assert.equal(fileData.ics.size, 34, 'number of ics')
  assert.ok(fileData.deopts.size >= 12, 'number of deopts')
  assert.equal(fileData.codes.size, 16, 'number of codes')
  assert.equal(fileData.src, fileSrc, 'file source')

  const deoptLocation = fileData.deoptLocations[0]
  assert.equal(deoptLocation, 'addAny:93:27', 'first deoptLocation')

  const deoptData = fileData.deopts.get(deoptLocation)
  assert.equal(deoptData.file, addersSrcFile, 'deopt file path')

  const updateData = deoptData.updates[2]
  assert.equal(updateData.bailoutType, 'eager', 'deopt update bailout type')
})

test('two-modules/adders.js', async () => {
  const srcFile = path.join(repoRoot, 'examples/two-modules/objects.js')
  const entryFile = path.join(repoRoot, 'examples/two-modules/adders.js')

  const result = await groupedLog(entryFile)
  assert.equal(result.size, 2, 'number of files')

  const fileData = result.get(srcFile)
  const fileSrc = await readFile(srcFile, 'utf8')
  assert.equal(fileData.fullPath, srcFile, 'fullPath')
  assert.equal(fileData.ics.size, 25, 'number of ics')
  assert.equal(fileData.codes.size, 9, 'number of codes')
  assert.equal(fileData.src, fileSrc, 'file source')

  const icLocation = fileData.icLocations[0]
  assert.equal(icLocation, 'Object1:3:12', 'first icLocation')

  const icData = fileData.ics.get(icLocation)
  assert.equal(icData.file, srcFile, 'ics file path')

  const updateData = icData.updates[0]
  // Map identifiers are heap addresses that vary per run
  assert.match(updateData.map, /^[0-9a-f]+$/, 'ics update map')
})
