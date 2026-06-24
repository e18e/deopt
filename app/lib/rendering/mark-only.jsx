import { Fragment } from 'preact'

function processLine(line, markerResolver, next, lineno) {
  const nodes = []
  let buf = ''
  let column = 0
  const cols = line.length - 1
  const writtenCols = new Set()
  function flush() {
    if (buf.length > 0) {
      nodes.push(buf)
      buf = ''
    }
  }
  function insert() {
    const { insertBefore, insertAfter } = markerResolver.resolve(next)
    if (insertBefore.length > 0) {
      flush()
      nodes.push(...insertBefore)
    }
    // Write char in column only once even if multiple markers exist for it
    if (!writtenCols.has(column)) buf += line[column]
    if (insertAfter.length > 0) {
      flush()
      nodes.push(...insertAfter)
    }
    writtenCols.add(column)
    next = markerResolver.nextLocation()
  }
  do {
    if (next == null) break
    // Work our way to the column of the next marker
    while (column < (next.column - 1) && column < cols) {
      buf += line[column++]
      if (column >= cols) break
    }
    insert()
  } while (next != null && next.line === lineno && column < cols)

  // Add remaining columns (after the last marker for this line)
  if (column < cols) buf += line.slice(column + 1)
  flush()

  return { nodes, nextLocation: next }
}

export function markOnly(code, markerResolver) {
  const lines = code.split('\n')
  const len = lines.length
  const totalDigits = String(len).length
  const rows = []
  let next = markerResolver.nextLocation()
  for (let lineno = 0; lineno < len; lineno++) {
    const line = lines[lineno]
    let nodes
    if (next == null || next.line > (lineno + 1)) {
      nodes = line
    } else {
      const res = processLine(line, markerResolver, next, lineno)
      nodes = res.nodes
      next = res.nextLocation
    }
    rows.push(
      <Fragment key={lineno}>
        <span>{String(lineno + 1).padStart(totalDigits)}: </span>
        <span>{nodes}</span>
        <br />
      </Fragment>
    )
  }
  return <div class="pre">{rows}</div>
}
