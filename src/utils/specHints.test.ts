import test from 'node:test';
import assert from 'node:assert/strict';
import { getSpecHint } from './specHints.ts';

test('provides contextual hints for Measurement Unit', () => {
  const hint = getSpecHint('Measurement unit');
  assert.ok(hint.includes('sales unit'));
  assert.ok(hint.includes('piece, pair'));
});

test('provides contextual hints for Gender', () => {
  const hint = getSpecHint('Gender');
  assert.ok(hint.includes('target audience'));
  assert.ok(hint.includes('Men, Women'));
});

test('provides contextual hints for Size System', () => {
  const hint = getSpecHint('Size System');
  assert.ok(hint.includes('sizing convention'));
  assert.ok(hint.includes('EU, US, UK'));
});

test('provides contextual hints for Sole Type', () => {
  const hint = getSpecHint('Sole Type');
  assert.ok(hint.includes('footwear outsole'));
  assert.ok(hint.includes('Rubber, Crepe'));
});

test('provides contextual hints for Brand', () => {
  const hint = getSpecHint('Brand');
  assert.ok(hint.includes('maker, workshop name'));
});

test('provides contextual hints for Custom Attributes', () => {
  const hint = getSpecHint('Custom attributes');
  assert.ok(hint.includes('Custom key-value specifications'));
});

test('provides sensible fallback for custom fields', () => {
  const hint = getSpecHint('Stitching Density');
  assert.ok(hint.length > 10);
});
