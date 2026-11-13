import test from 'node:test';
import assert from 'node:assert/strict';
import { getContactNumbers, normalizeAdditionalContactNumbers } from './contactDetails.ts';

test('normalizes additional numbers and removes blanks and duplicates', () => {
  assert.deepEqual(
    normalizeAdditionalContactNumbers('0917-000-0000', [' 0922-111-1111 ', '', '0917-000-0000', '0922-111-1111']),
    ['0922-111-1111'],
  );
});

test('returns primary and additional contact numbers in display order', () => {
  assert.deepEqual(
    getContactNumbers({ contactNumber: '0917-000-0000', additionalContactNumbers: ['0922-111-1111'] }),
    ['0917-000-0000', '0922-111-1111'],
  );
});
