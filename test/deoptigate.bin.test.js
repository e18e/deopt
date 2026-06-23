import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const repoRoot = (...args) => path.join(__dirname, '..', ...args)
const renderDataPath = path.join(
  tmpdir(),
  'deoptigate',
  'deoptigate.render-data.js'
)

const testOutPath = (...args) =>
  path.join(tmpdir(), 'deoptigate-tests', ...args)

const binPath = repoRoot('bin/deoptigate')

async function runDeoptigate(srcPath) {
  spawnSync(process.execPath, [binPath, srcPath])

  const contents = await readFile(renderDataPath, 'utf8')

  const outDir = path.dirname(path.relative(repoRoot(), srcPath))
  await mkdir(testOutPath(outDir), { recursive: true })

  const newContents = `function deoptigateRender(info) { return info; }; \nexport default ${contents.trim()};`
  const outPath = testOutPath(outDir, 'deoptigate.render-data.js')
  await writeFile(outPath, newContents, 'utf8')

  const mod = await import(pathToFileURL(outPath).href)
  return mod.default
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
