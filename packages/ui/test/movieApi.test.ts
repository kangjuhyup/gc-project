import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMovieSchedules, fetchMovies } from '@/features/movies/movieApi';
import { apiClient } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  apiClient: vi.fn(),
}));

const mockedApiClient = vi.mocked(apiClient);

describe('movieApi', () => {
  beforeEach(() => {
    mockedApiClient.mockResolvedValue({ items: [], hasNext: false });
  });

  it('영화 마스터 목록 조회 시 검색어와 커서 페이지를 전달한다', async () => {
    await fetchMovies({
      cursor: 'cursor-1',
      keyword: '  파묘  ',
    });

    expect(mockedApiClient).toHaveBeenCalledWith(
      '/movies?limit=20&keyword=%ED%8C%8C%EB%AC%98&cursor=cursor-1',
    );
  });

  it('영화 기준 상영시간표 endpoint를 호출한다', async () => {
    await fetchMovieSchedules(1, '2026-05-01');

    expect(mockedApiClient).toHaveBeenCalledWith('/movies/1/schedules?date=2026-05-01');
  });
});
