import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AdminProfileDto,
  CommandBus,
  LoginAdminCommand,
  LoginAdminResultDto,
} from '@application';
import { AuthenticatedAdminDto } from '@application/query/dto';
import { Admin } from '@presentation/decorator';
import { AdminAuthGuard } from '@presentation/guard';
import { LoginAdminRequestDto } from '../dto';

@ApiTags('Admin')
@Controller()
export class AdminController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({
    summary: '관리자 로그인',
    description: '환경변수에 설정된 관리자 계정으로 관리자 access token을 발급합니다.',
  })
  @ApiCreatedResponse({ type: LoginAdminResultDto, description: '관리자 로그인 성공' })
  @ApiUnauthorizedResponse({ description: '관리자 계정 정보가 일치하지 않는 경우' })
  @Post('/admin/login')
  login(@Body() body: LoginAdminRequestDto) {
    const request = LoginAdminRequestDto.of(body);
    return this.commandBus.execute(
      LoginAdminCommand.of({
        userId: request.userId,
        password: request.password,
      }),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '관리자 인증 확인',
    description: '관리자 access token을 검증하고 인증된 관리자 정보를 반환합니다.',
  })
  @ApiOkResponse({ type: AdminProfileDto, description: '인증된 관리자 정보' })
  @ApiUnauthorizedResponse({ description: 'Authorization 검증에 실패한 경우' })
  @UseGuards(AdminAuthGuard)
  @Get('/admin/me')
  me(@Admin() admin: AuthenticatedAdminDto): AdminProfileDto {
    return AdminProfileDto.of({ adminId: admin.adminId });
  }
}
