import { Component } from 'preact'

const severityClassNames = [
    'green i tc'
  , 'blue tc'
  , 'red b tc'
]

function coloredTds(arr) {
  return arr.map((x, idx) => {
    const className = x > 0
      ? severityClassNames[idx] + ' tr'
      : 'tc i gray'
    return <td key={idx} className={className}>{x}</td>
  })
}

function bySeverityScoreDesc({ summary: s1 }, { summary: s2 }) {
  return s1.severityScore < s2.severityScore ? 1 : -1
}

export class FilesView extends Component {
  render() {
    const { groups, includeAllSeverities, className = '' } = this.props
    const tableHeader = this._renderTableHeader()
    const rows = []
    const filesSeverities = Array.from(groups)
      .map(([ file, info ]) => ({ file, summary: info.summary }))
      .filter(({ summary }) => includeAllSeverities || summary.hasCriticalSeverities)
      .sort(bySeverityScoreDesc)

    for (const { file, summary } of filesSeverities) {
      const { icSeverities, deoptSeverities, codeSeverities } = summary
      const { relativePath } = groups.get(file)
      const rendered = this._renderFile({
          file
        , relativePath
        , icSeverities
        , deoptSeverities
        , codeSeverities
      })
      rows.push(rendered)
    }
    return (
      <div className={className}>
        <table className='files-table' cellSpacing='0'>
          {tableHeader}
          <tbody>{rows}</tbody>
        </table>
      </div>
    )
  }

  _renderTableHeader() {
    const topHeaderClass = 'header-row'
    const subHeaderClass = 'subhead'
    return (
      <thead>
        <tr>
          <td className={topHeaderClass}>File</td>
          <td colSpan='3' className={topHeaderClass}>Optimizations</td>
          <td colSpan='3' className={topHeaderClass}>Deoptimizations</td>
          <td colSpan='3' className={topHeaderClass}>Inline Caches</td>
        </tr>
        <tr>
          <td className={subHeaderClass} />
          <td className={subHeaderClass}>Optimized</td>
          <td className={subHeaderClass}>Optimizable</td>
          <td className={subHeaderClass}>Compiled</td>
          <td className={subHeaderClass}>Severity 1</td>
          <td className={subHeaderClass}>Severity 2</td>
          <td className={subHeaderClass}>Severity 3</td>
          <td className={subHeaderClass}>Severity 1</td>
          <td className={subHeaderClass}>Severity 2</td>
          <td className={subHeaderClass}>Severity 3</td>
        </tr>
      </thead>
    )
  }

  _renderFile({ file, relativePath, deoptSeverities, icSeverities, codeSeverities }) {
    const { selectedFile } = this.props

    const codeColumns = coloredTds(codeSeverities.slice(1))
    const deoptColumns = coloredTds(deoptSeverities.slice(1))
    const icColumns = coloredTds(icSeverities.slice(1))

    const onfileClicked = this._onfileClicked.bind(this, file)
    const selectedClass = file === selectedFile ? 'normalrow selected' : 'normalrow'
    return (
      <tr key={relativePath} className={selectedClass}>
        <td>
          <a className='file-link'
            href='#'
            onClick={onfileClicked}>
            {relativePath}
          </a>
        </td>
        {codeColumns}
        {deoptColumns}
        {icColumns}
      </tr>
    )
  }

  _onfileClicked(file) {
    const { onfileClicked } = this.props
    onfileClicked(file)
  }
}
