const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const icons = require('@tabler/icons-react');

const symbols = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{1F000}-\u{1F2FF}]/u;
const failures = [];
const imports = new Set();
let count = 0;
for (const relative of fs.readdirSync('src', { recursive: true })) {
  if (!/\.(ts|tsx|css|html)$/.test(relative)) continue;
  const file = path.join('src', relative);
  const source = fs.readFileSync(file, 'utf8');
  count++;
  source.split(/\r?\n/).forEach((line, index) => {
    const decoded = line.replace(/&#(x[\da-f]+|\d+);/gi, (_, code) =>
      String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code)));
    if (symbols.test(decoded)) failures.push(`${file}:${index + 1}: remaining symbol`);
  });
  if (!/\.tsx?$/.test(relative)) continue;
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  for (const statement of tree.statements) {
    if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== '@tabler/icons-react') continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const item of bindings.elements) {
      const name = (item.propertyName || item.name).text;
      imports.add(name);
      if (!icons[name]) failures.push(`${file}: missing Tabler export ${name}`);
    }
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${count} source files: zero symbol matches; all ${imports.size} Tabler icon exports verified.`);
}
