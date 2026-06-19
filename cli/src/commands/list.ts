import { buildManifest } from 'oauthlint-rules';
import pc from 'picocolors';

export interface ListOptions {
  json?: boolean;
  stream?: NodeJS.WritableStream;
}

export async function runList(opts: ListOptions = {}): Promise<number> {
  const out = opts.stream ?? process.stdout;
  const manifest = await buildManifest();

  if (opts.json) {
    out.write(`${JSON.stringify(manifest, null, 2)}\n`);
    return 0;
  }

  out.write(pc.bold(`OAuthLint — ${manifest.length} rules\n`));
  out.write(`${pc.dim('─'.repeat(70))}\n`);
  for (const m of manifest) {
    const sev = badge(m.severity);
    const llm = m.llmPrevalence === 'HIGH' ? pc.magenta('LLM↑') : pc.dim('     ');
    const id = pc.bold(m.id.padEnd(38, ' '));
    out.write(`${sev} ${llm} ${id} ${pc.dim(m.oauthlintId)}\n`);
    if (m.description) out.write(pc.dim(`         ${m.description}\n`));
  }
  return 0;
}

function badge(sev: string): string {
  switch (sev) {
    case 'ERROR':
      return pc.red(' ERR ');
    case 'WARNING':
      return pc.yellow(' WRN ');
    default:
      return pc.gray(' INF ');
  }
}
