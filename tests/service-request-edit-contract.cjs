const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const dashboard = fs.readFileSync('src/components/FarmerDashboard.tsx', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const businessWrites = fs.readFileSync('public/api/businessWrites.php', 'utf8');

test('posted requests expose edit/delete only for open requests and explain transaction locks', () => {
  assert.match(dashboard, /requestView === 'posted' && request\.status === 'pending'/);
  assert.match(dashboard, /With pending transaction/);
  assert.doesNotMatch(dashboard, /\(request\.status === 'matched' \|\| request\.status === 'completed'\) && request\.operatorName/);
});

test('service request editing and deletion wait for server confirmation', () => {
  assert.match(app, /handleUpdateServiceRequest = async/);
  assert.match(app, /handleDeleteServiceRequest = async/);
  assert.match(app, /persistServiceDeletion/);
});

test('server restricts pending request edits to the farmer and immutable fields', () => {
  assert.match(businessWrites, /Only the farmer who posted this request can edit or delete it/);
  assert.match(businessWrites, /Service transaction fields cannot be edited/);
});
