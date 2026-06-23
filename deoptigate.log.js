import path from 'node:path'

import { processLogContent, deoptigate } from './deoptigate.js'
import { lineReader } from './lib/line-reader.js'
import { resolveFiles } from './lib/grouping/resolve-files.js'
import { mapByFile } from './lib/grouping/group-by-file.js'

async function extractDataFromLog(p, { icStateChangesOnly, root }) {
  const lines = await lineReader(p, 'utf-8')
  root = root == null ? path.dirname(p) : root
  const processed = await processLogContent(lines, root)
  if (icStateChangesOnly) processed.filterIcStateChanges()
  return processed
}

export async function processLog(p, { icStateChangesOnly = true, root } = {}) {
  const extracted = await extractDataFromLog(p, { icStateChangesOnly, root })
  const data = extracted.toObject()
  const files = await resolveFiles(data)
  const groupedByFile = mapByFile(data, files)
  return groupedByFile
}

export async function logToJSON(p, { icStateChangesOnly = true, root } = {}) {
  const groupedByFile = await processLog(p, { icStateChangesOnly, root })
  return JSON.stringify(Array.from(groupedByFile), null, 2)
}

export async function deoptigateLog(p, { icStateChangesOnly = true } = {}) {
  const groupedByFile = await processLog(p, { icStateChangesOnly })
  return deoptigate(groupedByFile)
}
