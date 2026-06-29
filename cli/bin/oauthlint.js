#!/usr/bin/env node
import { buildProgram } from '../dist/cli.js';

const program = await buildProgram();
// Do NOT `await` parseAsync at the top level. Action handlers call
// `process.exit()`, so this promise never settles; a top-level `await` on it
// leaves the microtask queue with unfinished work that Node 22 races against
// the exit, intermittently turning a clean exit into code 13. Firing it without
// awaiting lets `process.exit()` win deterministically; we still surface genuine
// rejections (e.g. a thrown parse/validation error) as a non-zero exit.
program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
