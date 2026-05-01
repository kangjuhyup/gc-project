import { Logging } from '@kangjuhyup/rvlog';
import { MovieModel } from '@domain';
import { CreateMovieCommand, MovieCreatedDto } from '../dto';
import type { MovieRepositoryPort } from '../ports';

@Logging
export class CreateMovieCommandHandler {
  constructor(private readonly movieRepository: MovieRepositoryPort) {}

  async execute(command: CreateMovieCommand): Promise<MovieCreatedDto> {
    const movie = await this.movieRepository.save(
      MovieModel.of({
        title: command.title,
        director: command.director,
        genre: command.genre,
        runningTime: command.runningTime,
        rating: command.rating,
        releaseDate: command.releaseDate,
        posterUrl: command.posterUrl,
        description: command.description,
      }),
    );

    return MovieCreatedDto.of({
      movieId: movie.id,
      title: movie.title,
      director: movie.director,
      genre: movie.genre,
      runningTime: movie.runningTime,
      rating: movie.rating,
      releaseDate: movie.releaseDate?.toISOString().slice(0, 10),
      posterUrl: movie.posterUrl,
      description: movie.description,
    });
  }
}
