#!/usr/bin/env node
/** Time one acceptance command with shared-host load and retain its exact exit. */
import { spawn } from 'node:child_process';
import { loadavg, cpus } from 'node:os';
import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
const [label, command, ...args] = process.argv.slice(2);
if (!label || !command)
    throw Error('Usage: i7-command.mjs label command [arguments...]');
const out = resolve('artifacts/nextgen/i7-logs');
await mkdir(out, { recursive: true });
const record = { label, command: [command, ...args], started: new Date().toISOString(), loadStart: loadavg(), logicalCores: cpus().length }, start = performance.now();
const log = createWriteStream(resolve(out, `${label}.log`));
const child = spawn(command, args, { env: { ...process.env, VITEST_MAX_WORKERS: process.env.VITEST_MAX_WORKERS ?? '2' }, stdio: ['ignore', 'pipe', 'pipe'] });
child.stdout.pipe(log, { end: false });
child.stderr.pipe(log, { end: false });
child.on('error', e => log.write(String(e)));
const code = await new Promise(resolve => child.on('close', (code, signal) => { record.signal = signal; resolve(code ?? 1); }));
record.exitCode = code;
record.seconds = (performance.now() - start) / 1000;
record.loadEnd = loadavg();
record.finished = new Date().toISOString();
await new Promise(resolve => log.end(resolve));
await writeFile(resolve(out, `${label}.json`), JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify(record));
process.exitCode = code;
