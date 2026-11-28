const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = ts.createSourceFile('App.tsx', fs.readFileSync('src/App.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function handler(name, accounts, updates) {
  let initializer;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) initializer = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(initializer, `${name} exists`);
  const js = ts.transpileModule(`const action = ${initializer.getText(source)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  return new Function('registeredUsers', 'setRegisteredUsers', 'localStorage', 'alertDialog', `${js}\nreturn action;`)(
    accounts, next => updates.push(next),
    { setItem() { throw new DOMException('Storage is full', 'QuotaExceededError'); } },
    () => Promise.resolve(),
  );
}

const applicant = { name: 'Applicant', email: 'applicant@example.test', contactNumber: '09987654321', address: 'Pampanga', role: 'farmer', isApproved: false };
for (const name of ['handleApproveUser', 'handleRejectUser']) {
  const updates = [];
  const action = handler(name, [applicant], updates);
  let popupOpen = true;
  assert.doesNotThrow(() => { action(applicant.name, "Missing documents"); popupOpen = false; }, `${name} must return to the popup close action even when storage is full`);
  assert.equal(popupOpen, false);
  assert.equal(updates.length, 1);
  if (name === 'handleApproveUser') assert.equal(updates[0][0].isApproved, true);
  else { assert.equal(updates[0][0].registrationReviewStatus, 'rejected'); assert.equal(updates[0][0].registrationReviewReason, 'Missing documents'); assert.equal(updates[0][0].isApproved, false); }
}
const invalidUpdates = [];
handler('handleApproveUser', [{ ...applicant, address: '' }], invalidUpdates)(applicant.name);
assert.equal(invalidUpdates.length, 0, 'Required registration details remain enforced');
console.log('PASS: approval/rejection return to dialog close with full storage; approval validation preserved.');
