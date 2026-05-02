import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AdminMovieListResultDto,
  AdminMemberListResultDto,
  AdminProfileDto,
  CommandBus,
  CreateMovieCommand,
  ListAdminMembersQuery,
  ListAdminMoviesQuery,
  LoginAdminCommand,
  LoginAdminResultDto,
  MovieCreatedDto,
  QueryBus,
} from '@application';
import { MovieRatingType } from '@domain';
import { MemberStatusType } from '@domain';
import { AuthenticatedAdminDto } from '@application/query/dto';
import { Admin } from '@presentation/decorator';
import { AdminAuthGuard } from '@presentation/guard';
import { AdminPiiMaskInterceptor } from '@presentation/interceptor';
import {
  CreateMovieRequestDto,
  ListAdminMembersRequestDto,
  ListAdminMoviesRequestDto,
  LoginAdminRequestDto,
} from '../dto';

@ApiTags('Admin')
@Controller()
export class AdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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

  @ApiBearerAuth()
  @ApiOperation({
    summary: '관리자 영화 등록',
    description:
      '관리자가 영화 기본 정보를 등록합니다. 상영 일정은 별도 관리자 API에서 연결합니다.',
  })
  @ApiCreatedResponse({ type: MovieCreatedDto, description: '영화 등록 완료' })
  @ApiUnauthorizedResponse({ description: 'Authorization 검증에 실패한 경우' })
  @UseGuards(AdminAuthGuard)
  @Post('/admin/movies')
  createMovie(@Body() body: CreateMovieRequestDto) {
    const request = CreateMovieRequestDto.of(body);

    return this.commandBus.execute(
      CreateMovieCommand.of({
        title: request.title.trim(),
        runningTime: request.runningTime,
        director: request.director?.trim() || undefined,
        genre: request.genre?.trim() || undefined,
        rating: request.rating as MovieRatingType | undefined,
        releaseDate: request.releaseDate === undefined ? undefined : new Date(request.releaseDate),
        posterUrl: request.posterUrl?.trim() || undefined,
        description: request.description?.trim() || undefined,
      }),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '관리자 영화 목록 조회',
    description:
      '관리자가 등록된 영화 기본 정보를 페이지 기반으로 조회합니다. 상영 일정이 없는 영화도 포함합니다.',
  })
  @ApiOkResponse({ type: AdminMovieListResultDto, description: '관리자 영화 목록' })
  @ApiUnauthorizedResponse({ description: 'Authorization 검증에 실패한 경우' })
  @UseGuards(AdminAuthGuard)
  @Get('/admin/movies')
  listMovies(@Query() query: ListAdminMoviesRequestDto) {
    const request = ListAdminMoviesRequestDto.of(query);

    return this.queryBus.execute(
      ListAdminMoviesQuery.of({
        currentPage: request.currentPage,
        countPerPage: request.countPerPage,
        keyword: request.keyword?.trim() || undefined,
      }),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '관리자 회원 목록 조회',
    description: '관리자가 회원 상태와 기본 정보를 페이지 기반으로 조회합니다.',
  })
  @ApiOkResponse({ type: AdminMemberListResultDto, description: '관리자 회원 목록' })
  @ApiUnauthorizedResponse({ description: 'Authorization 검증에 실패한 경우' })
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(AdminPiiMaskInterceptor)
  @Get('/admin/members')
  listMembers(@Query() query: ListAdminMembersRequestDto) {
    const request = ListAdminMembersRequestDto.of(query);

    return this.queryBus.execute(
      ListAdminMembersQuery.of({
        currentPage: request.currentPage,
        countPerPage: request.countPerPage,
        keyword: request.keyword?.trim() || undefined,
        status: request.status as MemberStatusType | undefined,
      }),
    );
  }
}
