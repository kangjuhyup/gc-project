import {
  CheckUserIdAvailabilityQuery,
  CheckUserIdAvailabilityResultDto,
} from '../dto';
import type { MemberQueryPort } from '../ports';

export class CheckUserIdAvailabilityQueryHandler {
  constructor(private readonly memberQuery: MemberQueryPort) {}

  async execute(query: CheckUserIdAvailabilityQuery): Promise<CheckUserIdAvailabilityResultDto> {
    const exists = await this.memberQuery.existsByUserId(query.userId);

    return CheckUserIdAvailabilityResultDto.of({
      available: !exists,
    });
  }
}
