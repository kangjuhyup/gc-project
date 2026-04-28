export class SignupMemberResultDto {
  private constructor(
    readonly memberId: string,
    readonly userId: string,
  ) {}

  static of(params: { memberId: string; userId: string }): SignupMemberResultDto {
    return new SignupMemberResultDto(params.memberId, params.userId);
  }
}
