export class AuthenticatedAdminDto {
  readonly adminId: string;

  private constructor(adminId: string) {
    this.adminId = adminId;
  }

  static of(params: { adminId: string }): AuthenticatedAdminDto {
    return new AuthenticatedAdminDto(params.adminId);
  }
}
