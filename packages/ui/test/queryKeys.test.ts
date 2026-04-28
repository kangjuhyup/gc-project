import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/lib/queryKeys';

describe('queryKeys', () => {
  it('영화 query key를 안정적인 배열 형태로 생성한다', () => {
    expect(queryKeys.movies.list()).toEqual(['movies', 'list', '']);
    expect(queryKeys.movies.list('듄')).toEqual(['movies', 'list', '듄']);
    expect(queryKeys.movies.detail(1)).toEqual(['movies', 'detail', 1]);
  });
});
