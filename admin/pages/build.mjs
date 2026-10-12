import { cp, mkdir, rm } from 'node:fs/promises';

const source = new URL('../public/', import.meta.url);
const output = new URL('./public/', import.meta.url);
const library = new URL('./lib/', import.meta.url);

await rm(output, { recursive: true, force: true });
await cp(source, output, { recursive: true });
await mkdir(library, { recursive: true });
await cp(new URL('../src/api.js', import.meta.url), new URL('./api.js', library));
