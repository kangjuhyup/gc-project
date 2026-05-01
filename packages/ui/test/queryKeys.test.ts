import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/lib/queryKeys';

describe('queryKeys', () => {
  it('영화 query key를 안정적인 배열 형태로 생성한다', () => {
    expect(queryKeys.movies.list()).toEqual(['movies', 'list', '', '']);
    expect(queryKeys.movies.list('듄', '2026-04-28T10:30:00.000Z')).toEqual([
      'movies',
      'list',
      '듄',
      '2026-04-28T10:30:00.000Z',
    ]);
    expect(queryKeys.movies.detail(1)).toEqual(['movies', 'detail', 1]);
  });

  it('결제 query key를 안정적인 배열 형태로 생성한다', () => {
    expect(queryKeys.payments.all).toEqual(['payments']);
    expect(queryKeys.payments.detail('7001')).toEqual(['payments', 'detail', '7001']);
  });
});
