import { describe, expect, it } from 'vitest';
import { assertDefined, assertNonEmpty, assertTrue } from '@application/assertions';

describe('application assertions', () => {
  it('값이 undefined가 아니면 assertDefined는 통과한다', () => {
    expect(() => assertDefined('member', () => new Error('MEMBER_NOT_FOUND'))).not.toThrow();
  });

  it('값이 undefined이면 assertDefined는 지정한 에러를 던진다', () => {
    expect(() => assertDefined(undefined, () => new Error('MEMBER_NOT_FOUND'))).toThrow('MEMBER_NOT_FOUND');
  });

  it('배열이 비어있지 않으면 assertNonEmpty는 통과한다', () => {
    expect(() => assertNonEmpty(['seat-1'], () => new Error('INVALID_SEAT_HOLD_REQUEST'))).not.toThrow();
  });

  it('배열이 비어있으면 assertNonEmpty는 지정한 에러를 던진다', () => {
    expect(() => assertNonEmpty([], () => new Error('INVALID_SEAT_HOLD_REQUEST'))).toThrow(
      'INVALID_SEAT_HOLD_REQUEST',
    );
  });

  it('조건이 true이면 assertTrue는 통과한다', () => {
    expect(() => assertTrue(true, () => new Error('CONDITION_FAILED'))).not.toThrow();
  });

  it('조건이 false이면 assertTrue는 지정한 에러를 던진다', () => {
    expect(() => assertTrue(false, () => new Error('CONDITION_FAILED'))).toThrow('CONDITION_FAILED');
  });
});
