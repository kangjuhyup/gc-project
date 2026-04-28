import { Controller, Get, Query } from '@nestjs/common';
import { ListTheatersQuery, ListTheatersQueryHandler } from '@application';
import { ListTheatersRequestDto } from '../dto';

@Controller('/theaters')
export class TheaterController {
  constructor(private readonly listTheatersQueryHandler: ListTheatersQueryHandler) {}

  @Get()
  list(@Query() query: ListTheatersRequestDto) {
    const request = ListTheatersRequestDto.of(query);

    return this.listTheatersQueryHandler.execute(
      ListTheatersQuery.of({
        latitude: request.latitude,
        longitude: request.longitude,
      }),
    );
  }
}
