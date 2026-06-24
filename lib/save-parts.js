import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const tmpdir = os.tmpdir()
const deoptigateDir = path.join(tmpdir, 'deoptigate')

export function saveData(json) {
  fs.mkdirSync(deoptigateDir, { recursive: true })
  const dest = path.join(deoptigateDir, 'deoptigate.render-data.json')
  fs.writeFileSync(dest, json, 'utf8')
  return dest
}
