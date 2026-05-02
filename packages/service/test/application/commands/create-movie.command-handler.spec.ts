import { describe, expect, it, vi } from 'vitest';
import { MovieModel } from '@domain';
import { CreateMovieCommand } from '@application/commands/dto';
import { CreateMovieCommandHandler } from '@application/commands/handlers';
import type { MovieRepositoryPort } from '@application/commands/ports';

describe('CreateMovieCommandHandler', () => {
  it('관리자가 입력한 영화 기본 정보를 저장하고 생성 결과를 반환한다', async () => {
    const movieRepository = {
      save: vi.fn(async (movie: MovieModel) =>
        movie.setPersistence(
          'movie-1',
          new Date('2026-05-01T00:00:00.000Z'),
          new Date('2026-05-01T00:00:00.000Z'),
        ),
      ),
      findById: vi.fn(),
    } satisfies MovieRepositoryPort;
    const handler = new CreateMovieCommandHandler(movieRepository);

    const result = await handler.execute(
      CreateMovieCommand.of({
        title: '관리자 등록 영화',
        runningTime: 121,
        director: '감독',
        genre: '드라마',
        rating: '15',
        releaseDate: new Date('2026-05-01T00:00:00.000Z'),
        posterUrl: 'https://images.example.com/admin-movie.jpg',
        description: '관리자가 등록한 영화입니다.',
      }),
    );

    expect(movieRepository.save).toHaveBeenCalledOnce();
    expect(movieRepository.save.mock.calls[0][0].title).toBe('관리자 등록 영화');
    expect(movieRepository.save.mock.calls[0][0].runningTime).toBe(121);
    expect(result).toEqual({
      movieId: 'movie-1',
      title: '관리자 등록 영화',
      runningTime: 121,
      director: '감독',
      genre: '드라마',
      rating: '15',
      releaseDate: '2026-05-01',
      posterUrl: 'https://images.example.com/admin-movie.jpg',
      description: '관리자가 등록한 영화입니다.',
    });
  });
});
