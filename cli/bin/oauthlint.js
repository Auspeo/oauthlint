#!/usr/bin/env node
import { buildProgram } from '../dist/cli.js';

const program = await buildProgram();
await program.parseAsync(process.argv);
