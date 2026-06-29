export { buildProgram } from './cli.js';
export { runScan, type ScanCommandOptions } from './commands/scan.js';
export { runBaseline, type BaselineCommandOptions } from './commands/baseline.js';
export {
  BASELINE_VERSION,
  DEFAULT_BASELINE_FILE,
  type Baseline,
  type BaselineEntry,
  type BaselineFile,
  BaselineNotFoundError,
  BaselineParseError,
  buildBaseline,
  fingerprintFindings,
  loadBaseline,
  partitionByBaseline,
  serialiseBaseline,
} from './core/baseline.js';
export { runList, type ListOptions } from './commands/list.js';
export { runInit, type InitOptions } from './commands/init.js';
export { runDoctor, type DoctorOptions } from './commands/doctor.js';
export {
  runExplain,
  type ExplainOptions,
  type ExplainedRule,
} from './commands/explain.js';
export {
  applySuppressions,
  isSuppressed,
  loadSuppressionMap,
  parseSuppressionsFromSource,
} from './core/suppress.js';
export {
  SemgrepAdapter,
  type SemgrepAdapterOptions,
  SemgrepNotInstalledError,
  SemgrepOutputError,
  SemgrepResourceError,
} from './adapters/semgrep.js';
export { Reporter, type ReporterOptions } from './core/reporter.js';
export { loadConfig, DEFAULT_CONFIG } from './core/config.js';
export {
  exitCodeFor,
  highestSeverity,
  meetsThreshold,
  severityRank,
} from './core/severity.js';
export type {
  OAuthLintConfig,
  Finding,
  ScanResult,
  SeverityName,
} from './types.js';
export { SEVERITIES } from './types.js';
