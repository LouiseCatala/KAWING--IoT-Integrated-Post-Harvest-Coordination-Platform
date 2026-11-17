const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, context = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, ...context });
  return exports;
}
const { changesBetween, rebaseSnapshot, equal } = load('src/lib/databaseSync.ts');
const base = { users: [], harvests: [{ id: 'h1', status: 'posted', quantity: 10 }], services: [], offers: [], offeredServices: [], productionLoans: [], notifications: [], settings: { daReferencePrice: 22.8 } };
const copy = x => JSON.parse(JSON.stringify(x));
const local = copy(base); local.harvests[0].quantity = 12;
const remote = copy(base); remote.harvests.push({ id: 'h2', quantity: 5 }); remote.offers.push({ id: 'o2', offerPrice: 24 });
const rebased = rebaseSnapshot(base, local, remote);
assert.equal(rebased.harvests[0].quantity, 12);
assert.equal(rebased.harvests.length, 2);
assert.equal(rebased.offers.length, 1);
assert.equal(changesBetween(remote, rebased).length, 1, 'Only the unsaved edit should be posted');
assert.equal(changesBetween(remote, remote).length, 0, 'Receiving data must not trigger a write');
const duringSave = copy(local); duringSave.harvests[0].quantity = 15;
assert.equal(rebaseSnapshot(local, duringSave, rebased).harvests[0].quantity, 15);
const deleted = copy(base); deleted.harvests = [];
assert.equal(rebaseSnapshot(base, deleted, remote).harvests.length, 1, 'Local delete must not delete another user record');
const fieldRemote = copy(base); fieldRemote.harvests[0].status = 'completed';
assert.equal(rebaseSnapshot(base, local, fieldRemote).harvests[0].status, 'completed');
assert.equal(equal({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
const nonAdmin = copy(base); nonAdmin.users.push({ email: 'x' }); nonAdmin.settings.daReferencePrice = 1;
assert.equal(changesBetween(base, nonAdmin, false).length, 0);

// Deterministic fake clock/transport exercises fallback, reconnect, idle traffic and cleanup.
let now = 0, nextId = 1, calls = 0, sseAllowed = true, authStatus = 200;
const timers = new Map(), sources = [], listeners = {};
const clock = {
  setTimeout: (fn, ms = 0) => { const id = nextId++; timers.set(id, { fn, at: now + ms }); return id; },
  clearTimeout: id => timers.delete(id),
};
const events = {
  addEventListener: (name, fn) => { (listeners[name] ??= new Set()).add(fn); },
  removeEventListener: (name, fn) => listeners[name]?.delete(fn),
};
class FakeSource {
  constructor() { this.handlers = {}; this.closed = false; sources.push(this); }
  addEventListener(name, fn) { this.handlers[name] = fn; }
  close() { this.closed = true; }
  emit(name, data) { this.handlers[name]?.({ data: JSON.stringify(data) }); }
}
const ticks = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
async function advance(ms) {
  const until = now + ms;
  while (true) {
    const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
    if (!next || next[1].at > until) break;
    now = next[1].at; timers.delete(next[0]); next[1].fn(); await ticks();
  }
  now = until; await ticks();
}
const updates = load('src/lib/liveUpdates.ts', {
  ...clock, AbortController, EventSource: FakeSource, navigator: { onLine: true },
  window: events, document: { ...events, visibilityState: 'visible' },
  fetch: async () => { calls++; return { ok: authStatus === 200, status: authStatus, json: async () => ({ sse: sseAllowed, versions: Object.fromEntries(['users','harvests','services','offers','offeredServices','productionLoans','notifications','settings','announcements','faqs','moisture'].map(k => [k, '1'])) }) }; },
});
(async () => {
  let notifications = [], expired = false;
  const unsub = updates.subscribeLiveUpdates(topics => notifications.push([...topics]));
  let stop = updates.startLiveUpdates(() => { expired = true; });
  await ticks();
  assert.equal(sources.length, 1);
  const versions = Object.fromEntries(['users','harvests','services','offers','offeredServices','productionLoans','notifications','settings','announcements','faqs','moisture'].map(k => [k, '1']));
  sources[0].emit('versions', versions);
  notifications = [];
  await advance(10000); sources[0].emit('heartbeat', []);
  assert.equal(calls, 1, 'Healthy stream must stop polling');
  sources[0].emit('versions', { ...versions, offers: '2' });
  assert.deepEqual(notifications, [['offers']]);
  sources[0].onerror();
  await advance(10000);
  assert.ok(calls >= 2, 'Failed stream must poll');
  stop();
  assert.ok(sources.every(source => source.closed));
  assert.equal(timers.size, 0);
  sseAllowed = false;
  const prior = calls;
  stop = updates.startLiveUpdates(() => { expired = true; });
  await ticks(); await advance(10000);
  assert.equal(calls, prior + 2, 'Fallback polls at ten seconds');
  authStatus = 401;
  await advance(10000);
  assert.equal(expired, true);
  assert.equal(timers.size, 0);
  stop(); unsub();
  console.log('Realtime client checks passed: merge, no echo saves, queued edits, deletes, SSE, fallback, reconnect, expiration, cleanup.');
})().catch(error => { console.error(error); process.exitCode = 1; });
