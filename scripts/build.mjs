import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE = 'DNA-Social-Media-Plus.user.js';
const META = 'DNA-Social-Media-Plus.meta.js';
const END = '// ==/UserScript==';

const script = readFileSync(SOURCE, 'utf8').replace(/\r\n/g, '\n');
const end = script.indexOf(END);
if (!script.startsWith('// ==UserScript==') || end === -1) throw new Error(`${SOURCE} has no metadata block`);
const meta = script.slice(0, end + END.length) + '\n';

const version = (meta.match(/^\/\/ @version\s+(\S+)$/m) || [])[1];
if (!/^\d+\.\d$/.test(version || '')) throw new Error(`@version must be MAJOR.MINOR with one minor digit (1.1 ... 1.9, 2.0), got ${version}`);

if (!process.argv.includes('--check')) {
	writeFileSync(META, meta);
	console.log(`wrote ${META} (${version})`);
} else if (readFileSync(META, 'utf8').replace(/\r\n/g, '\n') !== meta) {
	console.error(`${META} is stale. Run "node scripts/build.mjs" and commit the result.`);
	process.exit(1);
} else {
	console.log(`${META} is current (${version})`);
}
