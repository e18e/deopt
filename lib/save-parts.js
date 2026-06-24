import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const tmpdir = os.tmpdir()
const deoptigateDir = path.join(tmpdir, 'deoptigate')

const buildDir = fileURLToPath(new URL('../app/build', import.meta.url))
const assets = ['deoptigate.js', 'deoptigate.css']

export function savePage(html) {
  fs.mkdirSync(deoptigateDir, { recursive: true })
  const dest = path.join(deoptigateDir, 'index.html')
  fs.writeFileSync(dest, html, 'utf8')
  return dest
}

export function saveData(json) {
  fs.mkdirSync(deoptigateDir, { recursive: true })
  const dest = path.join(deoptigateDir, 'deoptigate.render-data.json')
  fs.writeFileSync(dest, json, 'utf8')
  return dest
}

export function saveAssets() {
  fs.mkdirSync(deoptigateDir, { recursive: true })
  for (const asset of assets) {
    fs.copyFileSync(
      path.join(buildDir, asset)
    , path.join(deoptigateDir, asset)
    )
  }
}
