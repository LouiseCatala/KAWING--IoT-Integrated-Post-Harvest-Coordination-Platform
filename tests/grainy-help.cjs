const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/lib/grainyHelp.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const help = {};
new Function('exports', compiled)(help);
const farmer = { name: 'Test', role: 'farmer' };
const business = { name: 'Test', role: 'agricultural_business' };
for (const [question, user, language, expected] of [
  ['How can I book a dryer?', farmer, 'en', 'Partner Hub'],
  ['what are the classification of MC', farmer, 'en', '17% and above: Wet'],
  ['MC classifications and drying levels?', farmer, 'en', '15% to below 17%: Moderate'],
  ['Ano ang klasipikasyon ng MC?', farmer, 'tl', '17% pataas'],
  ['Paano mag-apply ng pautang?', farmer, 'tl', 'Farm Loans'],
  ['How do I publish a loan?', business, 'en', 'Loan Management'],
  ['Why service coverage?', business, 'en', 'only when'],
  ['Google token failed', farmer, 'en', 'reconnect'],
  ['Current moisture reading?', farmer, 'en', 'cannot read'],
  ['Where are my offers?', farmer, 'en', 'Price Offers Received'],
  ['Where are my offers?', business, 'en', 'My Price Offers'],
  ['Why did saving fail?', farmer, 'en', 'specific error'],
  ['Tell me something unknown', farmer, 'en', 'Which task'],
]) {
  assert.ok(help.answerGrainyLocally(question, user, language).includes(expected), question);
}
console.log('PASS: 13 Grainy help regression cases');
