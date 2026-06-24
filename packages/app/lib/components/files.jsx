import * as store from '../store.js';

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

function TableHeader() {
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

function FileRow({ file, relativePath, summary }) {
  const { icSeverities, deoptSeverities, codeSeverities } = summary;
  const codeColumns = coloredTds(codeSeverities.slice(1));
  const deoptColumns = coloredTds(deoptSeverities.slice(1));
  const icColumns = coloredTds(icSeverities.slice(1));

  const selectedClass =
    file === store.selectedFile.value ? 'normalrow selected' : 'normalrow';

  const onClick = (e) => {
    e.preventDefault();
    store.selectFile(file);
  };

  return (
    <tr className={selectedClass} onClick={onClick}>
      <td>
        <span className="file-link">{relativePath}</span>
      </td>
      {codeColumns}
      {deoptColumns}
      {icColumns}
    </tr>
  );
}

export function FilesView({ className = '' }) {
  const groups = store.groups.value;
  const includeAllSeverities = store.includeAllSeverities.value;

  const files = Array.from(groups)
    .map(([file, info]) => ({ file, summary: info.summary }))
    .filter(
      ({ summary }) => includeAllSeverities || summary.hasCriticalSeverities,
    )
    .sort(bySeverityScoreDesc);

  return (
    <div className={className}>
      <table className="files-table" cellSpacing="0">
        <TableHeader />
        <tbody>
          {files.map(({ file, summary }) => (
            <FileRow
              key={groups.get(file).relativePath}
              file={file}
              relativePath={groups.get(file).relativePath}
              summary={summary}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
