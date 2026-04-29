import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListTheatersQuery, QueryBus, TheaterListResultDto } from '@application';
import { ListTheatersRequestDto } from '../dto';

@ApiTags('Theaters')
@Controller('/theaters')
export class TheaterController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({
    summary: '영화관 목록 조회',
    description:
      '영화관 목록을 조회합니다. latitude와 longitude를 함께 전달하면 현재 위치와 가까운 영화관 순으로 정렬하고, 위치를 전달하지 않으면 기본 목록 순서로 반환합니다.',
  })
  @ApiOkResponse({ type: TheaterListResultDto, description: '영화관 목록' })
  @ApiBadRequestResponse({ description: '위도/경도 범위가 유효하지 않은 경우' })
  @Get()
  list(@Query() query: ListTheatersRequestDto) {
    const request = ListTheatersRequestDto.of(query);

    return this.queryBus.execute(
      ListTheatersQuery.of({
        latitude: request.latitude,
        longitude: request.longitude,
      }),
    );
  }
}
