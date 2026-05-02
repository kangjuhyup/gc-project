export class ListMovieScheduleQuery {
  private constructor(
    readonly movieId: string,
    readonly date: string,
    readonly startAt: Date,
    readonly endAt: Date,
  ) {}

  static of(params: { movieId: string; date?: string }): ListMovieScheduleQuery {
    const date = params.date ?? todayInKst();
    const startAt = new Date(`${date}T00:00:00+09:00`);
    const endAt = new Date(startAt);
    endAt.setUTCDate(endAt.getUTCDate() + 1);

    return new ListMovieScheduleQuery(params.movieId, date, startAt, endAt);
  }
}

function todayInKst(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
