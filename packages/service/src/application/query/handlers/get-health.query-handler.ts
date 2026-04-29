import { Logging } from '@kangjuhyup/rvlog';
import { GetHealthQuery, HealthStatusDto } from '../dto';

@Logging
export class GetHealthQueryHandler {
  execute(_query: GetHealthQuery): HealthStatusDto {
    return HealthStatusDto.of({
      ok: true,
      service: 'gc-project-service',
    });
  }
}
