import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const repoRoot = (...args) => path.join(__dirname, '..', ...args)
const renderDataPath = path.join(
  tmpdir(),
  'deoptigate',
  'deoptigate.render-data.json'
)

const binPath = repoRoot('bin/deoptigate')

async function runDeoptigate(srcPath) {
  spawnSync(process.execPath, [binPath, srcPath], {
    env: { ...process.env, DEOPTIGATE_NO_SERVE: '1' }
  })

  const contents = await readFile(renderDataPath, 'utf8')
  return JSON.parse(contents)
}

test('deoptigate simple/adders.js', async () => {
  const srcPath = repoRoot('examples/simple/adders.js')

  const renderData = await runDeoptigate(srcPath)
  assert.equal(renderData.length, 1, 'number of files')

  const fileName = renderData[0][0]
  assert.equal(fileName, srcPath, 'filename in render data')

  const fileData = renderData[0][1]
  assert.equal(fileData.fullPath, srcPath, 'fullPath')
  assert.ok(Array.isArray(fileData.ics), 'ics key is an Array')
  assert.ok(Array.isArray(fileData.deopts), 'deopts key is an Array')
  assert.ok(Array.isArray(fileData.codes), 'codes key is an Array')

  const fileSrc = await readFile(srcPath, 'utf8')
  assert.equal(fileData.src, fileSrc, 'file source')
})

test('deoptigate two-modules/adders.js', async () => {
  const srcPaths = [
    repoRoot('examples/two-modules/adders.js'),
    repoRoot('examples/two-modules/objects.js'),
  ]

  const renderData = await runDeoptigate(srcPaths[0])
  assert.equal(renderData.length, 2, 'number of files')

  for (let i = 0; i < renderData.length; i++) {
    const fileName = renderData[i][0]
    assert.equal(fileName, srcPaths[i], `filename in render data ${i}`)

    const fileData = renderData[i][1]
    assert.equal(fileData.fullPath, srcPaths[i], `fullPath ${i}`)
    assert.ok(Array.isArray(fileData.ics), `ics key is an Array ${i}`)
    assert.ok(Array.isArray(fileData.deopts), `deopts key is an Array ${i}`)
    assert.ok(Array.isArray(fileData.codes), `codes key is an Array ${i}`)

    const fileSrc = await readFile(srcPaths[i], 'utf8')
    assert.equal(fileData.src, fileSrc, `file source ${i}`)
  }
})
