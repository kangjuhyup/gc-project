import { ApiProperty } from '@nestjs/swagger';

export class CheckUserIdAvailabilityResultDto {
  @ApiProperty({ example: true, description: '회원 아이디 사용 가능 여부' })
  readonly available: boolean;

  private constructor(available: boolean) {
    this.available = available;
  }

  static of(params: { available: boolean }): CheckUserIdAvailabilityResultDto {
    return new CheckUserIdAvailabilityResultDto(params.available);
  }
}
