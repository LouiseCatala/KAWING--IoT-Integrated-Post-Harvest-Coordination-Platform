const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const compile = (path) => ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
const providerCode = compile('src/context/AppContext.tsx');
const bootCode = fs.readFileSync('index.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
for (const initial of [null, 'dark', 'light', 'invalid']) {
  const values = new Map(initial === null ? [] : [['kawing_theme', initial]]);
  const classes = new Set(['dark']);
  const root = { classList: { remove: (c) => classes.delete(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) } };
  const storage = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
  vm.runInNewContext(bootCode, { localStorage: storage, document: { documentElement: root } });
  assert.equal(classes.has('dark'), initial !== 'light', 'preload theme');
  let cursor = 0;
  const state = [];
  const react = {
    createContext: () => ({ Provider: 'Provider' }),
    useContext: () => null,
    useEffect: (fn) => fn(),
    useState: (init) => {
      const i = cursor++;
      if (!(i in state)) state[i] = typeof init === 'function' ? init() : init;
      return [state[i], (fn) => { state[i] = typeof fn === 'function' ? fn(state[i]) : fn; }];
    },
    createElement: (type, props) => ({ type, props }),
  };
  const exports = {};
  vm.runInNewContext(providerCode, { exports, require: (id) => id === 'react' ? react : { translations: { en: {}, tl: {} } }, localStorage: storage, window: { document: { documentElement: root } } });
  const render = () => { cursor = 0; return exports.AppProvider({ children: null }).props.value; };
  let app = render();
  const expected = initial === 'light' ? 'light' : 'dark';
  assert.equal(app.theme, expected);
  assert.equal(values.get('kawing_theme'), expected);
  app.toggleTheme();
  app = render();
  assert.equal(app.theme, expected === 'dark' ? 'light' : 'dark');
  assert.equal(classes.has('dark'), app.theme === 'dark');
  assert.equal(values.get('kawing_theme'), app.theme);
  vm.runInNewContext(bootCode, { localStorage: storage, document: { documentElement: root } });
  assert.equal(classes.has('dark'), app.theme === 'dark', 'reload preference');
}
// Compile and inspect the real JSX click handler for every placement and theme.
const toggleCode = compile('src/components/ThemeToggle.tsx');
async function checkToggle() {
for (const theme of ['dark', 'light']) {
  for (const variant of ['landing', 'sidebar', 'floating']) {
    for (const mode of ['unsupported', 'reduced', 'animated', 'skipped']) {
    const order = [];
    const exports = {};
    const classes = new Set(theme === 'dark' ? ['dark'] : []);
    const properties = new Map();
    let transitions = 0;
    const root = {
      classList: { add: c => classes.add(c), remove: c => classes.delete(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) },
      style: { setProperty: (k, v) => properties.set(k, v), removeProperty: k => properties.delete(k) },
    };
    const document = { documentElement: root };
    const sidebarClasses = new Set();
    const sidebar = { matches: () => true, classList: { add: c => sidebarClasses.add(c), remove: c => sidebarClasses.delete(c) } };
    if (mode !== 'unsupported') document.startViewTransition = callback => {
      transitions++;
      assert.equal(sidebarClasses.has('theme-reveal-expanded'), variant === 'sidebar', 'Sidebar stays expanded during the reveal');
      assert.equal(properties.get('--theme-reveal-x'), '120px');
      assert.equal(properties.get('--theme-reveal-y'), '70px');
      assert.ok(parseFloat(properties.get('--theme-reveal-radius')) >= Math.hypot(880, 730));
      callback();
      return { ready: mode === 'skipped' ? Promise.reject(new Error('Skipped')) : Promise.resolve(), finished: Promise.resolve() };
    };
    const context = { theme, toggleTheme: () => order.push('toggle') };
    vm.runInNewContext(toggleCode, { exports, document, window: { innerWidth: 1000, innerHeight: 800, requestAnimationFrame: fn => fn(), matchMedia: () => ({ matches: mode === 'reduced' }) }, React: { createElement: (type, props, child) => ({ type, props, child }) }, require: (id) => id === 'lucide-react' ? { Moon: 'Moon', Sun: 'Sun' } : id === 'react-dom' ? { flushSync: fn => fn() } : { useApp: () => context } });
    const button = exports.default({ variant });
    assert.equal(button.props.type, 'button');
    assert.equal(button.child.type, theme === 'dark' ? 'Sun' : 'Moon');
    assert.ok(button.props['aria-label']);
    assert.ok(button.props.title);
    await button.props.onClick({ stopPropagation: () => order.push('stop'), currentTarget: { closest: () => variant === 'sidebar' ? sidebar : null, getBoundingClientRect: () => ({ left: 100, top: 50, width: 40, height: 40 }) } });
    assert.deepEqual(order, ['stop', 'toggle']);
    assert.equal(transitions, mode === 'animated' || mode === 'skipped' ? 1 : 0);
    if (transitions) assert.equal(classes.has('dark'), theme === 'light');
    assert.equal(properties.size, 0);
    assert.equal(classes.has('theme-revealing'), false);
    assert.equal(sidebarClasses.size, 0, 'Normal hover behavior resumes after the reveal');
    }
  }
}
console.log('Theme checks passed: saved preference, reload, all toggle placements, circular reveal, reduced motion, skipped transitions, and cleanup.');
}
checkToggle().catch(error => { console.error(error); process.exitCode = 1; });
