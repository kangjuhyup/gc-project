export class AuthenticatedUserDto {
  private constructor(
    readonly memberId: string,
    readonly userId: string,
  ) {}

  static of(params: { memberId: string; userId: string }): AuthenticatedUserDto {
    return new AuthenticatedUserDto(params.memberId, params.userId);
  }
}
