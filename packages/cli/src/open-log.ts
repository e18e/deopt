import open from 'tiny-open';

import { logToJSON, processLog } from './log.js';
import { groupByFileAndLocation } from './grouping/group-by-file-and-location.js';
import { buildReport } from './report.js';
import { renderMarkdown } from './markdown.js';
import { saveData } from './save-parts.js';
import { startServer } from './server.js';

interface OpenLogOptions {
  md?: boolean;
}

export async function openLog(
  v8log: string,
  head: string,
  { md = false }: OpenLogOptions = {},
): Promise<void> {
  if (md) {
    const groupedByFile = await processLog(v8log, { root: process.cwd() });
    const report = buildReport(groupByFileAndLocation(groupedByFile));
    process.stdout.write(renderMarkdown(report));
    return;
  }

  const data = await logToJSON(v8log, { root: process.cwd() });
  const dataFile = saveData(data);

  // Data-only mode writes the render data and exits without starting the
  // server, so the data can be generated non-interactively (e.g. in tests).
  if (process.env['DEOPTIGATE_NO_SERVE']) {
    console.error(`${head}: Wrote render data to ${dataFile}`);
    return;
  }

  const { url } = await startServer({ dataFile });

  console.error(`
${head}: Successfully generated deoptimization visualization  🎉
${head}: Serving at ${url}
${head}: Opening now in your default browser (Ctrl-C to stop the server).
    `);
  open(url);
}
