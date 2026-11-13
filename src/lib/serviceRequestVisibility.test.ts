import test from 'node:test';
import assert from 'node:assert/strict';
import { isAvailableServiceRequestFor } from './serviceRequestVisibility.ts';
import type { ServiceRequest } from '../types.ts';

const request = (overrides: Partial<ServiceRequest>): ServiceRequest => ({
  id: 'service-1',
  type: 'storage',
  harvestId: 'harvest-1',
  cropType: 'Palay',
  quantity: 1000,
  unit: 'kg',
  status: 'pending',
  createdAt: '2026-11-12',
  farmerEmail: 'farmer@example.com',
  farmerName: 'Farmer',
  location: 'Arayat, Pampanga',
  ...overrides,
});

test('shows every open service category in buyer Available Jobs', () => {
  for (const type of ['transport', 'storage', 'drying', 'milling'] as const) {
    assert.equal(isAvailableServiceRequestFor(request({ type }), 'buyer@example.com'), true);
  }
});

test('keeps requests assigned to another provider private', () => {
  assert.equal(isAvailableServiceRequestFor(request({ operatorEmail: 'other@example.com' }), 'buyer@example.com'), false);
  assert.equal(isAvailableServiceRequestFor(request({ operatorEmail: 'BUYER@example.com' }), 'buyer@example.com'), true);
});

test('hides non-pending and buyer-purchase requests', () => {
  assert.equal(isAvailableServiceRequestFor(request({ status: 'matched' }), 'buyer@example.com'), false);
  assert.equal(isAvailableServiceRequestFor(request({ status: 'expired' }), 'buyer@example.com'), false);
  assert.equal(isAvailableServiceRequestFor(request({ type: 'buyer' }), 'buyer@example.com'), false);
});
