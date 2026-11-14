import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE = 'DNA-Social-Media-Plus.user.js';
const END = '// ==/UserScript==';

// Installs from the 9GAG Plus era still poll these paths through the old repository name.
const LEGACY = { '9GAG-Plus.user.js': 'script', '9GAG-Plus.meta.js': 'meta' };

const script = readFileSync(SOURCE, 'utf8');
const end = script.indexOf(END);
if (!script.startsWith('// ==UserScript==') || end === -1) throw new Error(`${SOURCE} has no metadata block`);
const meta = script.slice(0, end + END.length) + '\n';

const outputs = { 'DNA-Social-Media-Plus.meta.js': meta };
for (const [file, kind] of Object.entries(LEGACY)) outputs[file] = kind === 'meta' ? meta : script;

const check = process.argv.includes('--check');
const stale = [];
for (const [file, content] of Object.entries(outputs)) {
	if (!check) writeFileSync(file, content);
	else if (readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== content.replace(/\r\n/g, '\n')) stale.push(file);
}

if (stale.length) {
	console.error(`stale: ${stale.join(', ')}. Run "node scripts/build.mjs" and commit the result.`);
	process.exit(1);
}
console.log(check ? 'generated files are current' : `wrote ${Object.keys(outputs).join(', ')}`);
