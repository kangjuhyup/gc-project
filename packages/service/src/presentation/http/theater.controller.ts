import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListTheaterScheduleQuery, ListTheatersQuery, QueryBus, TheaterListResultDto, TheaterScheduleResultDto } from '@application';
import {
  ListTheaterScheduleParamRequestDto,
  ListTheaterScheduleRequestDto,
  ListTheatersRequestDto,
} from '../dto';

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

  @ApiOperation({
    summary: '영화관별 상영 시간표 조회',
    description:
      '특정 영화관에서 지정한 날짜에 상영하는 영화와 상영 시간을 영화별로 묶어 조회합니다. date를 생략하면 KST 기준 오늘 날짜를 사용합니다.',
  })
  @ApiOkResponse({ type: TheaterScheduleResultDto, description: '영화관별 일자 상영 시간표' })
  @ApiBadRequestResponse({ description: 'theaterId 또는 date query 파라미터가 유효하지 않은 경우' })
  @Get('/:theaterId/schedules')
  listSchedule(
    @Param() params: ListTheaterScheduleParamRequestDto,
    @Query() query: ListTheaterScheduleRequestDto,
  ) {
    const requestParams = ListTheaterScheduleParamRequestDto.of(params);
    const requestQuery = ListTheaterScheduleRequestDto.of(query);

    return this.queryBus.execute(
      ListTheaterScheduleQuery.of({
        theaterId: requestParams.theaterId,
        date: requestQuery.date,
      }),
    );
  }
}
