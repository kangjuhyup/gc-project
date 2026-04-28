import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupMemberRequestDto {
  @ApiProperty({ example: 'movie_user', pattern: '^[a-z][a-z0-9_]{3,19}$', description: '회원 로그인 ID' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{3,19}$/)
  readonly userId!: string;

  @ApiProperty({ example: 'password123!', minLength: 8, maxLength: 72, description: '회원 비밀번호' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  readonly password!: string;

  @ApiProperty({ example: '홍길동', minLength: 1, maxLength: 50, description: '회원 이름' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly name!: string;

  @ApiProperty({ example: '1990-01-01', description: '생년월일. ISO date 문자열' })
  @IsDateString()
  readonly birthDate!: string;

  @ApiProperty({ example: '01012345678', pattern: '^\\d{10,11}$', description: '휴대전화번호' })
  @IsString()
  @Matches(/^\d{10,11}$/)
  readonly phoneNumber!: string;

  @ApiProperty({ example: '서울특별시 강남구 테헤란로 427', minLength: 1, maxLength: 255, description: '회원 주소' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  readonly address!: string;

  @ApiProperty({ example: '1', description: '인증 완료된 휴대전화 인증 요청 ID' })
  @IsString()
  readonly phoneVerificationId!: string;

  private constructor(params: {
    userId: string;
    password: string;
    name: string;
    birthDate: string;
    phoneNumber: string;
    address: string;
    phoneVerificationId: string;
  }) {
    Object.assign(this, params);
  }

  static of(params: {
    userId: string;
    password: string;
    name: string;
    birthDate: string;
    phoneNumber: string;
    address: string;
    phoneVerificationId: string;
  }): SignupMemberRequestDto {
    return new SignupMemberRequestDto(params);
  }
}
