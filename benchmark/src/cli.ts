import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { resolveAdapters } from './adapters/index.js';
import { PROMPTS, type Prompt, selectPrompts } from './prompts.js';
import { anonymizeResult, toJson, toMarkdown } from './report.js';
import { runBenchmark } from './runner.js';

const DEFAULT_SAMPLES = 5;
const DEFAULT_OUT = 'benchmark/results';

interface RunOptions {
  models: string[];
  samples: number;
  anonymize: boolean;
  out: string;
  promptIds?: string[];
}

const USAGE = `oauthlint-benchmark - measure the auth anti-patterns AI models produce

Usage:
  oauthlint-benchmark run [options]

Options:
  --models <keys>     Comma-separated adapter keys (mock, anthropic, openai). Default: mock
  --samples <n>       Samples to generate per prompt per model. Default: ${DEFAULT_SAMPLES}
  --anonymize         Label models as "Model A/B/..." in the report (default)
  --no-anonymize      Use the real model ids in the report
  --prompts <ids>     Comma-separated prompt ids to run (default: all)
  --out <dir>         Output directory for report.md and report.json. Default: ${DEFAULT_OUT}
  -h, --help          Show this help

Real model adapters require an API key in the environment (ANTHROPIC_API_KEY,
OPENAI_API_KEY). The mock adapter is offline and needs no key.
`;

function parseRunArgs(args: string[]): RunOptions {
  const options: RunOptions = {
    models: ['mock'],
    samples: DEFAULT_SAMPLES,
    anonymize: true,
    out: DEFAULT_OUT,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--models':
      case '--samples':
      case '--prompts':
      case '--out': {
        const value = args[++i];
        if (value === undefined) throw new Error(`Missing value for ${arg}.`);
        if (arg === '--models') options.models = value.split(',');
        else if (arg === '--prompts') options.promptIds = value.split(',');
        else if (arg === '--out') options.out = value;
        else {
          const n = Number.parseInt(value, 10);
          if (!Number.isInteger(n) || n < 1) {
            throw new Error(`--samples must be a positive integer, got "${value}".`);
          }
          options.samples = n;
        }
        break;
      }
      case '--anonymize':
        options.anonymize = true;
        break;
      case '--no-anonymize':
        options.anonymize = false;
        break;
      default:
        throw new Error(`Unknown option "${arg}". Run with --help for usage.`);
    }
  }

  return options;
}

function selectRunPrompts(ids?: string[]): readonly Prompt[] {
  if (!ids || ids.length === 0) return PROMPTS;
  const chosen = selectPrompts(ids);
  if (chosen.length === 0) {
    throw new Error(`No prompts matched ids: ${ids.join(', ')}.`);
  }
  return chosen;
}

async function runCommand(args: string[]): Promise<void> {
  const options = parseRunArgs(args);
  const adapters = resolveAdapters(options.models);
  const prompts = selectRunPrompts(options.promptIds);

  const result = await runBenchmark({ adapters, samples: options.samples, prompts });

  const reported = options.anonymize ? anonymizeResult(result) : result;
  const markdown = toMarkdown(result, { anonymize: options.anonymize });
  const json = toJson(reported);

  const outDir = isAbsolute(options.out) ? options.out : resolve(process.cwd(), options.out);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'report.md'), markdown, 'utf8');
  await writeFile(join(outDir, 'report.json'), json, 'utf8');

  process.stdout.write(`${markdown}\n`);
  process.stdout.write(`Wrote report.md and report.json to ${outDir}\n`);
}

/** CLI entry point. Returns a process exit code. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const [command, ...rest] = argv;

  if (!command || command === '-h' || command === '--help' || command === 'help') {
    process.stdout.write(USAGE);
    return 0;
  }

  if (command !== 'run') {
    process.stderr.write(`Unknown command "${command}". Run with --help for usage.\n`);
    return 1;
  }

  if (rest.includes('-h') || rest.includes('--help')) {
    process.stdout.write(USAGE);
    return 0;
  }

  try {
    await runCommand(rest);
    return 0;
  } catch (err) {
    process.stderr.write(`benchmark failed: ${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }
}
