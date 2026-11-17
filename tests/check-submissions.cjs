const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');
let now = 1000;
const mod = { exports: {} };
const compiled = ts.transpileModule(fs.readFileSync('src/lib/submissionGuard.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
vm.runInNewContext(compiled, { module: mod, exports: mod.exports, crypto: webcrypto, Date: { now: () => now } });
const { createSubmissionGuard, newRecordId } = mod.exports;
const guard = createSubmissionGuard();
assert.equal(guard('loan', { amount: 100 }), true);
assert.equal(guard('loan', { amount: 100 }), false);
assert.equal(guard('loan', { amount: 200 }), true);
assert.equal(guard('offer', { amount: 100 }), true);
now += 2000;
assert.equal(guard('loan', { amount: 100 }), true);
const ids = new Set(Array.from({ length: 10000 }, () => newRecordId('PL')));
assert.equal(ids.size, 10000);
for (const id of ids) assert.match(id, /^PL_[a-f0-9]{32}$/);
console.log('Duplicate-click guard, independent submissions, expiry and record ID checks passed.');
