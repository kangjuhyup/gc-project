import { Controller, Get } from '@nestjs/common';
import { GetHealthQueryHandler } from '../../application/query/handlers';
import { HealthStatusDto } from '../../application/query/dto';

@Controller()
export class HealthController {
  constructor(private readonly getHealthQueryHandler: GetHealthQueryHandler) {}

  @Get()
  getHealth(): HealthStatusDto {
    return this.getHealthQueryHandler.execute();
  }
}
