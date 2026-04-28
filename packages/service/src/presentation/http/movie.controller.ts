import { Controller, Get, Query } from '@nestjs/common';
import { ListMoviesQuery, ListMoviesQueryHandler } from '@application';
import { ListMoviesRequestDto } from '../dto';

@Controller('/movies')
export class MovieController {
  constructor(private readonly listMoviesQueryHandler: ListMoviesQueryHandler) {}

  @Get()
  list(@Query() query: ListMoviesRequestDto) {
    const request = ListMoviesRequestDto.of(query);

    return this.listMoviesQueryHandler.execute(
      ListMoviesQuery.of({
        time: request.time === undefined ? undefined : new Date(request.time),
        limit: request.limit,
        keyword: request.keyword?.trim() || undefined,
        cursor: request.cursor,
      }),
    );
  }
}
