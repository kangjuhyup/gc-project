import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetHealthQuery, HealthStatusDto, QueryBus } from '@application';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({
    summary: '서비스 상태 확인',
    description:
      '애플리케이션 프로세스가 요청을 처리할 수 있는지 확인합니다. 로드밸런서/헬스체크 용도로 사용합니다.',
  })
  @ApiOkResponse({ type: HealthStatusDto, description: '서비스가 정상 응답함' })
  @Get()
  getHealth(): Promise<HealthStatusDto> {
    return this.queryBus.execute<GetHealthQuery, HealthStatusDto>(GetHealthQuery.of());
  }
}
