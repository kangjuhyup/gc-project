import { ApiProperty } from '@nestjs/swagger';

export class AdminProfileDto {
  @ApiProperty({ example: 'admin', description: '관리자 ID' })
  readonly adminId: string;

  private constructor(adminId: string) {
    this.adminId = adminId;
  }

  static of(params: { adminId: string }): AdminProfileDto {
    return new AdminProfileDto(params.adminId);
  }
}
