export class MemberPasswordChangedDto {
  private constructor(
    readonly userId: string,
    readonly changed: boolean,
  ) {}

  static of(params: { userId: string; changed: boolean }): MemberPasswordChangedDto {
    return new MemberPasswordChangedDto(params.userId, params.changed);
  }
}
