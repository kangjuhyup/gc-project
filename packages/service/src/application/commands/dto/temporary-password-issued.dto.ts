export class TemporaryPasswordIssuedDto {
  private constructor(
    readonly userId: string,
    readonly temporaryPassword: string,
  ) {}

  static of(params: { userId: string; temporaryPassword: string }): TemporaryPasswordIssuedDto {
    return new TemporaryPasswordIssuedDto(params.userId, params.temporaryPassword);
  }
}
