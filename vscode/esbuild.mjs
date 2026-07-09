import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { RULES_ROOT } from 'oauthlint-rules';

/**
 * Build the VS Code extension into a self-contained bundle.
 *
 * The extension runs the OAuthLint engine in-process, so the engine and its JS
 * dependencies are bundled into `dist/extension.js`. The rule pack, however, is
 * DATA read from disk at scan time, so esbuild does not bundle it — we copy the
 * rule YAMLs into `dist/rules` and the runner points Semgrep at that directory
 * (resolved relative to `__dirname`). Only Semgrep stays an external runtime
 * dependency.
 */

const here = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(here, 'dist');
const rulesOut = join(distDir, 'rules');

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await build({
  entryPoints: [join(here, 'src', 'extension.ts')],
  outfile: join(distDir, 'extension.js'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  // `vscode` is provided by the extension host at runtime and must never be
  // bundled; everything else (the engine + its deps) ships inside the bundle.
  external: ['vscode'],
  sourcemap: true,
  minify: false,
  logLevel: 'info',
  // Some bundled engine modules are authored as ESM and read `import.meta.url`
  // (to locate their own on-disk assets). In a CJS bundle that expression is
  // otherwise empty and would throw at load. Point it at the bundle's own path
  // so those modules resolve to a valid URL. The runner never relies on those
  // values (it locates the rule pack via `__dirname`), so a bundle-relative
  // path here is harmless — it only has to be well-formed.
  banner: {
    js: "const __oauthlintBundleUrl = require('node:url').pathToFileURL(__filename).href;",
  },
  define: {
    'import.meta.url': '__oauthlintBundleUrl',
  },
});

// Copy the rule YAMLs next to the bundle so the runner can point Semgrep at
// `dist/rules` at runtime. RULES_ROOT resolves to the rule pack's source dir.
await cp(RULES_ROOT, rulesOut, { recursive: true });
