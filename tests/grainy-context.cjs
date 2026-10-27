const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file) {
  const exports = {};
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', output)(exports, name => load(path.resolve(path.dirname(file), `${name}.ts`)));
  return exports;
}
const { relevantGrainyFaqs, grainyAccountContext } = load('src/lib/grainyContext.ts');
const { buildGrainySystemPrompt } = load('src/lib/grainyKnowledge.ts');
const faq = (id, questionEn, answerEn) => ({ id, questionEn, answerEn, questionTl: questionEn, answerTl: answerEn });
const faqs = Array.from({ length: 35 }, (_, i) => faq(String(i), 'Generic welcome', 'Welcome'));
faqs.push(faq('loan', 'How to apply for a loan?', 'Use Farm Loans'));
faqs.push(faq('moisture', 'Moisture classifications', 'Categories'));
assert.equal(relevantGrainyFaqs('pautang', faqs)[0].id, 'loan');
assert.equal(relevantGrainyFaqs('MC', faqs)[0].id, 'moisture');
assert.deepEqual(relevantGrainyFaqs('unrelatedword', faqs), []);
const user = { name: 'PRIVATE NAME', email: 'private@example.test', password: 'PRIVATE PASSWORD', documents: { govId: 'PRIVATE ID' }, role: 'agricultural_business', isApproved: true, businessCapabilities: { drying: { enabled: true, approvalStatus: 'pending', isAvailable: false } } };
const context = JSON.parse(grainyAccountContext(user, 'My Posted Services'));
assert.equal(context.screen, 'My Posted Services');
assert.equal(context.capabilities.find(c => c.name === 'drying').approval, 'pending');
const prompt = buildGrainySystemPrompt(user, 'tl', faqs, 'pautang', 'Loan Management');
for (const privateValue of ['PRIVATE NAME', 'private@example.test', 'PRIVATE PASSWORD', 'PRIVATE ID']) assert.ok(!prompt.includes(privateValue));
for (const required of ['Loan Management', 'Use Farm Loans', 'Pick-up Place', 'Drop Place', 'MC means moisture content', 'capability', 'Google', 'price per kg']) assert.ok(prompt.includes(required), required);
console.log('PASS: relevant FAQ retrieval beyond first 30, bilingual aliases, screen/capability context, privacy and cross-workflow prompt coverage');
