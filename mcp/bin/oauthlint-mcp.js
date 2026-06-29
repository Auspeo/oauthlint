#!/usr/bin/env node
import { main } from '../dist/index.js';

main().catch((err) => {
  process.stderr.write(`oauthlint-mcp failed to start: ${err?.message ?? err}\n`);
  process.exit(1);
});
