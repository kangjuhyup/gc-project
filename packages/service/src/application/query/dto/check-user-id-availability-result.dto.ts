export class CheckUserIdAvailabilityResultDto {
  private constructor(readonly available: boolean) {}

  static of(params: { available: boolean }): CheckUserIdAvailabilityResultDto {
    return new CheckUserIdAvailabilityResultDto(params.available);
  }
}
