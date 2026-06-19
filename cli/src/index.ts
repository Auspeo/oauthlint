export { buildProgram } from './cli.js';
export { runScan, type ScanCommandOptions } from './commands/scan.js';
export { runList, type ListOptions } from './commands/list.js';
export { runInit, type InitOptions } from './commands/init.js';
export { runDoctor, type DoctorOptions } from './commands/doctor.js';
export {
  applySuppressions,
  isSuppressed,
  loadSuppressionMap,
  parseSuppressionsFromSource,
} from './core/suppress.js';
export { SemgrepAdapter, SemgrepNotInstalledError } from './adapters/semgrep.js';
export { Reporter, type ReporterOptions } from './core/reporter.js';
export { loadConfig, DEFAULT_CONFIG } from './core/config.js';
export {
  exitCodeFor,
  highestSeverity,
  meetsThreshold,
  severityRank,
} from './core/severity.js';
export type {
  AuthwatchConfig,
  Finding,
  ScanResult,
  SeverityName,
} from './types.js';
export { SEVERITIES } from './types.js';
