import { Component } from 'preact';

function coloredTds(arr) {
  return arr.map((x, idx) => {
    const tdClass = idx === 0 ? 'num group-start' : 'num';
    const content =
      x > 0 ? (
        <span className={`pill sev-${idx + 1}`}>{x}</span>
      ) : (
        <span className="zero">0</span>
      );
    return (
      <td key={idx} className={tdClass}>
        {content}
      </td>
    );
  });
}

function bySeverityScoreDesc({ summary: s1 }, { summary: s2 }) {
  return s1.severityScore < s2.severityScore ? 1 : -1;
}

export class FilesView extends Component {
  render() {
    const { groups, includeAllSeverities, className = '' } = this.props;
    const tableHeader = this.#renderTableHeader();
    const rows = [];
    const filesSeverities = Array.from(groups)
      .map(([file, info]) => ({ file, summary: info.summary }))
      .filter(
        ({ summary }) => includeAllSeverities || summary.hasCriticalSeverities,
      )
      .sort(bySeverityScoreDesc);

    for (const { file, summary } of filesSeverities) {
      const { icSeverities, deoptSeverities, codeSeverities } = summary;
      const { relativePath } = groups.get(file);
      const rendered = this.#renderFile({
        file,
        relativePath,
        icSeverities,
        deoptSeverities,
        codeSeverities,
      });
      rows.push(rendered);
    }
    return (
      <div className={className}>
        <table className="files-table" cellSpacing="0">
          {tableHeader}
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  }

  #renderTableHeader() {
    const topHeaderClass = 'header-row';
    const subHeaderClass = 'subhead';
    return (
      <thead>
        <tr>
          <td className={topHeaderClass}>File</td>
          <td colSpan="3" className={`${topHeaderClass} group-start`}>
            Optimizations
          </td>
          <td colSpan="3" className={`${topHeaderClass} group-start`}>
            Deoptimizations
          </td>
          <td colSpan="3" className={`${topHeaderClass} group-start`}>
            Inline Caches
          </td>
        </tr>
        <tr>
          <td className={subHeaderClass} />
          <td className={`${subHeaderClass} group-start`}>Optimized</td>
          <td className={subHeaderClass}>Optimizable</td>
          <td className={subHeaderClass}>Compiled</td>
          <td className={`${subHeaderClass} group-start`}>Severity 1</td>
          <td className={subHeaderClass}>Severity 2</td>
          <td className={subHeaderClass}>Severity 3</td>
          <td className={`${subHeaderClass} group-start`}>Severity 1</td>
          <td className={subHeaderClass}>Severity 2</td>
          <td className={subHeaderClass}>Severity 3</td>
        </tr>
      </thead>
    );
  }

  #renderFile({
    file,
    relativePath,
    deoptSeverities,
    icSeverities,
    codeSeverities,
  }) {
    const { selectedFile } = this.props;

    const codeColumns = coloredTds(codeSeverities.slice(1));
    const deoptColumns = coloredTds(deoptSeverities.slice(1));
    const icColumns = coloredTds(icSeverities.slice(1));

    const onFileClicked = this.#onFileClicked.bind(this, file);
    const selectedClass =
      file === selectedFile ? 'normalrow selected' : 'normalrow';
    return (
      <tr key={relativePath} className={selectedClass} onClick={onFileClicked}>
        <td>
          <span className="file-link">{relativePath}</span>
        </td>
        {codeColumns}
        {deoptColumns}
        {icColumns}
      </tr>
    );
  }

  #onFileClicked(file, e) {
    e.preventDefault();
    const { onFileClicked } = this.props;
    onFileClicked(file);
  }
}
