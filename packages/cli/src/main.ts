import { groupByFileAndLocation } from './grouping/group-by-file-and-location.js';
import { processLog } from './log.js';
import { buildReport } from './report.js';

export { groupByFileAndLocation, processLog, buildReport };
export type { Report, ReportFile, ReportDiagnostic } from './report.js';
