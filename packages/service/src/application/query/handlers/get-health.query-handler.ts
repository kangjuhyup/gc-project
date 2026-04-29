import { Logging } from '@kangjuhyup/rvlog';
import { HealthStatusDto } from '../dto';

@Logging
export class GetHealthQueryHandler {
  execute(): HealthStatusDto {
    return HealthStatusDto.of({
      ok: true,
      service: 'gc-project-service',
    });
  }
}
