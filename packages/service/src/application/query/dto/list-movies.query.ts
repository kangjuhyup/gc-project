export class ListMoviesQuery {
  private constructor(
    readonly time: Date,
    readonly limit: number,
    readonly keyword?: string,
    readonly cursor?: string,
  ) {}

  static of(params: {
    time?: Date;
    limit?: number;
    keyword?: string;
    cursor?: string;
  }): ListMoviesQuery {
    return new ListMoviesQuery(
      normalizeToHour(params.time ?? new Date()),
      params.limit ?? 20,
      params.keyword,
      params.cursor,
    );
  }
}

function normalizeToHour(time: Date): Date {
  const normalized = new Date(time);
  normalized.setUTCMinutes(0, 0, 0);
  return normalized;
}
