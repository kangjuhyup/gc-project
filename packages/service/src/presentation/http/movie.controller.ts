import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ListMovieScheduleQuery,
  ListMoviesQuery,
  MovieListResultDto,
  MovieScheduleResultDto,
  QueryBus,
} from '@application';
import {
  ListMovieScheduleParamRequestDto,
  ListMovieScheduleRequestDto,
  ListMoviesRequestDto,
} from '../dto';

@ApiTags('Movies')
@Controller('/movies')
export class MovieController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({
    summary: '영화 목록 조회',
    description: '상영 시간표를 포함하지 않는 영화 마스터 목록을 커서 기반으로 조회합니다.',
  })
  @ApiOkResponse({ type: MovieListResultDto, description: '커서 기반 영화 목록' })
  @ApiBadRequestResponse({
    description: 'time, limit, cursor 등 query 파라미터가 유효하지 않은 경우',
  })
  @Get()
  list(@Query() query: ListMoviesRequestDto) {
    const request = ListMoviesRequestDto.of(query);

    return this.queryBus.execute(
      ListMoviesQuery.of({
        limit: request.limit,
        keyword: request.keyword?.trim() || undefined,
        cursor: request.cursor,
      }),
    );
  }

  @ApiOperation({
    summary: '영화별 상영 시간표 조회',
    description:
      '특정 영화가 지정한 날짜에 어떤 영화관/상영관에서 몇 시에 상영하는지 영화관별로 묶어 조회합니다. date를 생략하면 KST 기준 오늘 날짜를 사용합니다.',
  })
  @ApiOkResponse({ type: MovieScheduleResultDto, description: '영화별 일자 상영 시간표' })
  @ApiBadRequestResponse({ description: 'movieId 또는 date query 파라미터가 유효하지 않은 경우' })
  @Get('/:movieId/schedules')
  listSchedule(
    @Param() params: ListMovieScheduleParamRequestDto,
    @Query() query: ListMovieScheduleRequestDto,
  ) {
    const requestParams = ListMovieScheduleParamRequestDto.of(params);
    const requestQuery = ListMovieScheduleRequestDto.of(query);

    return this.queryBus.execute(
      ListMovieScheduleQuery.of({
        movieId: requestParams.movieId,
        date: requestQuery.date,
      }),
    );
  }
}
