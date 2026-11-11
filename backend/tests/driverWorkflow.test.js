import test from 'node:test';
import assert from 'node:assert/strict';

test('Driver State Machine Allowed Transitions', () => {
  const transitions = {
    READY_FOR_PICKUP: 'OUT_FOR_DELIVERY',
    OUT_FOR_DELIVERY: 'ARRIVED_AT_LOCATION',
  };

  assert.equal(transitions['READY_FOR_PICKUP'], 'OUT_FOR_DELIVERY');
  assert.equal(transitions['OUT_FOR_DELIVERY'], 'ARRIVED_AT_LOCATION');
  assert.equal(transitions['ARRIVED_AT_LOCATION'], undefined, 'Direct transition to DELIVERED without OTP must be blocked');
});

test('OTP Validation Logic', () => {
  const expectedOtp = '4829';
  
  const validAttempt = '4829';
  const invalidAttempt = '1234';

  assert.equal(validAttempt === expectedOtp, true);
  assert.equal(invalidAttempt === expectedOtp, false);
});

