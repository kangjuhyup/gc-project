import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/lib/queryKeys';

describe('queryKeys', () => {
  it('creates stable movie keys', () => {
    expect(queryKeys.movies.list()).toEqual(['movies', 'list']);
    expect(queryKeys.movies.detail(1)).toEqual(['movies', 'detail', 1]);
  });
});
