const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let now = 0, nextId = 0;
const timers = new Map();
const events = () => {
  const listeners = new Map();
  return {
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn); },
    emit(name) { listeners.get(name)?.forEach(fn => fn()); },
    count() { return [...listeners.values()].reduce((sum, set) => sum + set.size, 0); },
  };
};
const window = events(), document = { ...events(), visibilityState: 'visible' };
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/grainyPeeking.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports: exportsObject, window, document,
  setTimeout(fn, delay) { const id = ++nextId; timers.set(id, { fn, at: now + delay }); return id; },
  clearTimeout(id) { timers.delete(id); },
});
const advance = ms => {
  const end = now + ms;
  while (true) {
    const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
    if (!next || next[1].at > end) break;
    now = next[1].at; timers.delete(next[0]); next[1].fn();
  }
  now = end;
};
let peeks = [];
let stop = exportsObject.startGrainyPeeking(() => peeks.push(now));
advance(9999); assert.equal(peeks.length, 0);
advance(1); assert.deepEqual(peeks, [10000], 'Idle should peek at ten seconds');
advance(8000); assert.equal(peeks.length, 1, 'The greeting remains visible for eight seconds');
advance(24999); assert.equal(peeks.length, 1, 'Regular peeking must wait twenty-five seconds after the greeting hides');
advance(1); assert.equal(peeks[1], 43000, 'Next regular peek follows eight visible seconds and twenty-five hidden seconds');
stop(); assert.equal(timers.size, 0); assert.equal(window.count() + document.count(), 0);

now = 0; peeks = [];
stop = exportsObject.startGrainyPeeking(() => peeks.push(now));
for (let i = 0; i < 4; i++) { advance(5000); window.emit('click'); }
advance(4999); assert.equal(peeks.length, 0);
advance(1); assert.deepEqual(peeks, [25000], 'Active users should see the regular twenty-five-second peek');
advance(2000); window.emit('click');
advance(9999); assert.equal(peeks.length, 1);
advance(1); assert.equal(peeks[1], 37000, 'Clicking resets the idle countdown');
document.visibilityState = 'hidden'; document.emit('visibilitychange');
advance(60000); assert.equal(peeks.length, 2, 'Hidden tabs must not peek');
document.visibilityState = 'visible'; document.emit('visibilitychange');
advance(10000); assert.equal(peeks.length, 3, 'Returning to the tab restarts timing');
stop(); advance(60000); assert.equal(peeks.length, 3, 'Opening chat or unmounting must cancel timing');
assert.equal(timers.size, 0);

now = 0; peeks = [];
stop = exportsObject.startGrainyPeeking(() => peeks.push(now));
for (let i = 0; i < 19; i++) { advance(5000); window.emit('click'); }
assert.deepEqual(peeks, [25000, 58000, 91000], 'Continuous activity must retain twenty-five hidden seconds between eight-second peeks');
stop();
assert.equal(timers.size, 0);
for (const event of ['click', 'pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart']) {
  now = 0; peeks = [];
  stop = exportsObject.startGrainyPeeking(() => peeks.push(now));
  advance(9000); window.emit(event);
  advance(9999); assert.equal(peeks.length, 0, `${event} must reset the idle countdown`);
  advance(1); assert.deepEqual(peeks, [19000], `Idle should peek ten seconds after ${event}`);
  stop();
  assert.equal(timers.size, 0);
  assert.equal(window.count() + document.count(), 0);
}
console.log('Grainy timing checks passed: 25 seconds after hiding, 10 seconds without activity, all activity resets, hidden-tab pause, cleanup.');
