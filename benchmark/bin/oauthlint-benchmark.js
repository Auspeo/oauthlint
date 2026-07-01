#!/usr/bin/env node
import { main } from '../dist/cli.js';

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    process.stderr.write(`oauthlint-benchmark failed to start: ${err?.message ?? err}\n`);
    process.exit(1);
  });
