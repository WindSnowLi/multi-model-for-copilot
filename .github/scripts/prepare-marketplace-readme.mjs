#!/usr/bin/env node
// Strips the `<!-- marketplace-readme:remove-* -->` block from the source README
// so the packaged marketplace page omits the install badges. Runs on every
// platform (the previous bash + awk version required a POSIX shell).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const sourcePath = process.argv[2] ?? 'README.md';
const outputPath = process.argv[3] ?? 'dist/README.marketplace.md';

const lines = readFileSync(sourcePath, 'utf8').split(/\r?\n/);
const kept = [];
let removing = false;
let blocks = 0;

for (const line of lines) {
	if (line.includes('marketplace-readme:remove-start')) {
		if (removing) {
			throw new Error('Nested marketplace-readme remove block.');
		}
		removing = true;
		blocks++;
		continue;
	}
	if (line.includes('marketplace-readme:remove-end')) {
		if (!removing) {
			throw new Error('Unexpected marketplace-readme remove end marker.');
		}
		removing = false;
		continue;
	}
	if (!removing) {
		kept.push(line);
	}
}

if (removing) {
	throw new Error('Unclosed marketplace-readme remove block.');
}
if (blocks !== 1) {
	throw new Error(`Expected 1 marketplace-readme remove block, found ${blocks}.`);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, kept.join('\n'));
console.log(`Wrote ${outputPath} (${kept.length} lines, ${blocks} block removed).`);
