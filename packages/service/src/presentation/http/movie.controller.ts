import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListMoviesQuery, MovieListResultDto, QueryBus } from '@application';
import { ListMoviesRequestDto } from '../dto';

@ApiTags('Movies')
@Controller('/movies')
export class MovieController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({
    summary: '영화 목록 조회',
    description:
      '기준 시각과 가장 가까운 상영을 가진 영화 순으로 목록을 조회합니다. time은 정시 단위로 내림 보정되며, cursor가 있으면 다음 페이지를 조회합니다.',
  })
  @ApiOkResponse({ type: MovieListResultDto, description: '커서 기반 영화 목록' })
  @ApiBadRequestResponse({ description: 'time, limit, cursor 등 query 파라미터가 유효하지 않은 경우' })
  @Get()
  list(@Query() query: ListMoviesRequestDto) {
    const request = ListMoviesRequestDto.of(query);

    return this.queryBus.execute(
      ListMoviesQuery.of({
        time: request.time === undefined ? undefined : new Date(request.time),
        limit: request.limit,
        keyword: request.keyword?.trim() || undefined,
        cursor: request.cursor,
      }),
    );
  }
}
