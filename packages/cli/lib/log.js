import path from 'node:path'

import { processLogContent } from '@e18e/deopt-processor'
import { lineReader } from './line-reader.js'
import { groupByFileAndLocation } from './grouping/group-by-file-and-location.js'
import { groupByFile } from './grouping/group-by-file.js'
import { resolveFiles } from './grouping/resolve-files.js'

export function deoptigate(groupedByFile) {
  const groupedByFileAndLocation = groupByFileAndLocation(groupedByFile)
  return groupedByFileAndLocation
}

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
  const groupedByFile = groupByFile(data, files)
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
