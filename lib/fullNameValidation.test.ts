import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFullName } from './fullNameValidation.ts';

test('validateFullName accepts valid names', () => {
  const res = validateFullName('Amina Mansouri');
  assert.equal(res.isValid, true);
  assert.equal(res.cleanName, 'Amina Mansouri');
});

test('validateFullName rejects names with digits', () => {
  const res = validateFullName('John123');
  assert.equal(res.isValid, false);
});

test('validateFullName rejects empty names', () => {
  const res = validateFullName('');
  assert.equal(res.isValid, false);
});
