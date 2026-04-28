import { HealthStatusDto } from '../dto';

export class GetHealthQueryHandler {
  execute(): HealthStatusDto {
    return HealthStatusDto.of({
      ok: true,
      service: 'gc-project-service',
    });
  }
}
