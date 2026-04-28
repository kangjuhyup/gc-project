export class LoginMemberResultDto {
  private constructor(
    readonly memberId: string,
    readonly userId: string,
  ) {}

  static of(params: { memberId: string; userId: string }): LoginMemberResultDto {
    return new LoginMemberResultDto(params.memberId, params.userId);
  }
}
