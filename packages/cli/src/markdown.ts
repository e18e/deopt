import type { Report } from './report.js';

const severityNames = ['low', 'medium', 'high'];

interface IssueGroup {
  issue: string;
  tip: string | null;
  severity: number;
  locations: string[];
}

function severityName(severity: number): string {
  return severityNames[severity - 1] ?? String(severity);
}

/**
 * Renders a report as markdown grouped by issue: one section per distinct
 * problem, with its tip stated once and the affected locations listed beneath.
 * Aimed at being concise and unambiguous for an LLM to act on.
 */
export function renderMarkdown(report: Report): string {
  const groups = new Map<string, IssueGroup>();
  for (const { file, diagnostics } of report.files) {
    for (const diagnostic of diagnostics) {
      let group = groups.get(diagnostic.issue);
      if (group === undefined) {
        group = {
          issue: diagnostic.issue,
          tip: diagnostic.tip,
          severity: diagnostic.severity,
          locations: [],
        };
        groups.set(diagnostic.issue, group);
      }
      group.severity = Math.max(group.severity, diagnostic.severity);
      const at = `${file}:${diagnostic.line}:${diagnostic.column}`;
      group.locations.push(
        diagnostic.functionName ? `${at}  ${diagnostic.functionName}` : at,
      );
    }
  }

  if (groups.size === 0) {
    return '# Deoptimization report\n\nNo deoptimizations found.\n';
  }

  const ordered = Array.from(groups.values()).sort(
    (a, b) => b.severity - a.severity || a.issue.localeCompare(b.issue),
  );

  const sections = ordered.map((group) => {
    const heading = `## ${group.issue}  (${severityName(group.severity)})`;
    const body = group.tip === null ? [] : [group.tip];
    const list = group.locations.map((location) => `- ${location}`);
    return [heading, ...body, '', ...list].join('\n');
  });

  return `# Deoptimization report\n\n${sections.join('\n\n')}\n`;
}
