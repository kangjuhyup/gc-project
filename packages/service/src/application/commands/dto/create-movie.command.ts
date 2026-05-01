import type { MovieRatingType } from '@domain';

export class CreateMovieCommand {
  private constructor(
    readonly title: string,
    readonly runningTime: number,
    readonly director?: string,
    readonly genre?: string,
    readonly rating?: MovieRatingType,
    readonly releaseDate?: Date,
    readonly posterUrl?: string,
    readonly description?: string,
  ) {}

  static of(params: {
    title: string;
    runningTime: number;
    director?: string;
    genre?: string;
    rating?: MovieRatingType;
    releaseDate?: Date;
    posterUrl?: string;
    description?: string;
  }): CreateMovieCommand {
    return new CreateMovieCommand(
      params.title,
      params.runningTime,
      params.director,
      params.genre,
      params.rating,
      params.releaseDate,
      params.posterUrl,
      params.description,
    );
  }
}
