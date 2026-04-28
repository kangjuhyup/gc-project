export class MovieTheaterSummaryDto {
  private constructor(
    readonly id: number,
    readonly name: string,
    readonly address: string,
  ) {}

  static of(params: {
    id: number;
    name: string;
    address: string;
  }): MovieTheaterSummaryDto {
    return new MovieTheaterSummaryDto(params.id, params.name, params.address);
  }
}

export class MovieScreeningSummaryDto {
  private constructor(
    readonly id: number,
    readonly screenName: string,
    readonly startAt: string,
    readonly endAt: string,
    readonly remainingSeats: number,
    readonly totalSeats: number,
    readonly theater: MovieTheaterSummaryDto,
  ) {}

  static of(params: {
    id: number;
    screenName: string;
    startAt: string;
    endAt: string;
    remainingSeats: number;
    totalSeats: number;
    theater: MovieTheaterSummaryDto;
  }): MovieScreeningSummaryDto {
    return new MovieScreeningSummaryDto(
      params.id,
      params.screenName,
      params.startAt,
      params.endAt,
      params.remainingSeats,
      params.totalSeats,
      params.theater,
    );
  }
}

export class MovieSummaryDto {
  private constructor(
    readonly id: number,
    readonly title: string,
    readonly genre: string,
    readonly rating: string,
    readonly runningTime: number,
    readonly releaseDate: string,
    readonly posterUrl: string,
    readonly description: string,
    readonly screenings: MovieScreeningSummaryDto[],
  ) {}

  static of(params: {
    id: number;
    title: string;
    genre: string;
    rating: string;
    runningTime: number;
    releaseDate: string;
    posterUrl: string;
    description: string;
    screenings: MovieScreeningSummaryDto[];
  }): MovieSummaryDto {
    return new MovieSummaryDto(
      params.id,
      params.title,
      params.genre,
      params.rating,
      params.runningTime,
      params.releaseDate,
      params.posterUrl,
      params.description,
      params.screenings,
    );
  }
}

export class MovieListResultDto {
  private constructor(
    readonly items: MovieSummaryDto[],
    readonly hasNext: boolean,
    readonly nextCursor?: string,
  ) {}

  static of(params: {
    items: MovieSummaryDto[];
    hasNext: boolean;
    nextCursor?: string;
  }): MovieListResultDto {
    return new MovieListResultDto(params.items, params.hasNext, params.nextCursor);
  }
}
