import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

import { deoptigateLog } from '../deoptigate.log.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function repoRoot(...args) {
  return path.join(__dirname, '..', ...args)
}

/**
 * Replace the temporary paths to source files with the real path
 * to the source files
 * @param {string} srcLog The path to the log file to prepare
 * @param {string[][]} replacements An array of [template, realPath]
 */
async function prepareLogFile(srcLog, replacements) {
  let contents = await readFile(srcLog, 'utf8')

  // Windows + Git shenanigans
  contents = contents.replace(/\r\n/g, '\n')
  for (const [template, realPath] of replacements) {
    contents = contents.replace(
      new RegExp(RegExp.escape(template), 'g'),
      realPath
    )
  }

  const destLog = srcLog.replace(/\.v8\.log$/g, '.prepared.v8.log')
  await writeFile(destLog, contents, 'utf8')
  return destLog
}

test('adders.v8.log', async () => {
  const replacements = [
    [
      '/tmp/deoptigate/examples/simple/adders.js',
      repoRoot('examples/simple/adders.js'),
    ],
  ]
  const addersSrcFile = replacements[0][1]
  const srcLogPath = path.join(__dirname, 'logs', 'adders.v8.log')
  const destLogPath = await prepareLogFile(srcLogPath, replacements)

  const result = await deoptigateLog(destLogPath)
  assert.equal(result.size, 1, 'number of files')

  const fileData = result.get(addersSrcFile)
  const fileSrc = await readFile(addersSrcFile, 'utf8')
  assert.equal(fileData.fullPath, addersSrcFile, 'fullPath')
  assert.equal(fileData.ics.size, 33, 'number of ics')
  assert.equal(fileData.deopts.size, 7, 'number of deopts')
  assert.equal(fileData.codes.size, 16, 'number of codes')
  assert.equal(fileData.src, fileSrc, 'file source')

  const deoptLocation = fileData.deoptLocations[0]
  assert.equal(deoptLocation, 'addAny:93:27', 'first deoptLocation')

  const deoptData = fileData.deopts.get(deoptLocation)
  assert.equal(deoptData.file, addersSrcFile, 'deopt file path')

  const updateData = deoptData.updates[2]
  assert.equal(updateData.bailoutType, 'eager', 'deopt update bailout type')
})

test('two-modules.v8.log', async () => {
  const replacements = [
    [
      '/tmp/deoptigate/examples/two-modules/adders.js',
      repoRoot('examples/two-modules/adders.js'),
    ],
    [
      '/tmp/deoptigate/examples/two-modules/objects.js',
      repoRoot('examples/two-modules/objects.js'),
    ],
  ]

  const srcFile = replacements[1][1]
  const srcLogPath = path.join(__dirname, 'logs', 'two-modules.v8.log')
  const destLogPath = await prepareLogFile(srcLogPath, replacements)

  const result = await deoptigateLog(destLogPath)
  assert.equal(result.size, 2, 'number of files')

  const fileData = result.get(srcFile)
  const fileSrc = await readFile(srcFile, 'utf8')
  assert.equal(fileData.fullPath, srcFile, 'fullPath')
  assert.equal(fileData.ics.size, 25, 'number of ics')
  assert.equal(fileData.deopts.size, 0, 'number of deopts')
  assert.equal(fileData.codes.size, 8, 'number of codes')
  assert.equal(fileData.src, fileSrc, 'file source')

  const icLocation = fileData.icLocations[0]
  assert.equal(icLocation, 'Object1:3:12', 'first icLocation')

  const icData = fileData.ics.get(icLocation)
  assert.equal(icData.file, srcFile, 'ics file path')

  const updateData = icData.updates[0]
  assert.equal(updateData.map, '37cdf3b7a811', 'ics update map')
})
