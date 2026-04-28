import { DocumentBuilder } from '@nestjs/swagger';

export const SWAGGER_DOCUMENT_PATH = 'docs';
export const SWAGGER_JSON_PATH = 'docs-json';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('GC Movie Reservation Service API')
    .setDescription(
      [
        '영화 예매 서비스 백엔드 API 문서입니다.',
        '회원가입/로그인, 휴대전화 인증, 주소 검색, 영화 목록, 영화관 목록 API를 제공합니다.',
        'ValidationPipe가 whitelist와 forbidNonWhitelisted를 사용하므로 문서에 없는 요청 필드는 거부됩니다.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addTag('Health', '서비스 상태 확인')
    .addTag('Members', '회원가입, 로그인, 비밀번호 및 휴대전화 인증')
    .addTag('Addresses', '공공 주소 API 기반 주소 검색')
    .addTag('Movies', '영화 목록과 상영 정보 조회')
    .addTag('Theaters', '영화관 목록과 위치 기반 정렬')
    .build();
}
