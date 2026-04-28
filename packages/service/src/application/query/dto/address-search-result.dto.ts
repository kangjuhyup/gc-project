import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressSearchItemDto {
  @ApiProperty({ example: '서울특별시 강남구 테헤란로 427', description: '전체 도로명 주소' })
  readonly roadAddress: string;

  @ApiProperty({ example: '서울특별시 강남구 테헤란로 427', description: '도로명 주소 기본 영역' })
  readonly roadAddressPart1: string;

  @ApiProperty({ example: '101동 1001호', description: '도로명 주소 상세/참고 영역' })
  readonly roadAddressPart2: string;

  @ApiProperty({ example: '서울특별시 강남구 삼성동 143-48', description: '지번 주소' })
  readonly jibunAddress: string;

  @ApiProperty({ example: '427, Teheran-ro, Gangnam-gu, Seoul', description: '영문 주소' })
  readonly englishAddress: string;

  @ApiProperty({ example: '06159', description: '우편번호' })
  readonly zipCode: string;

  @ApiProperty({ example: '1168010500', description: '행정구역 코드' })
  readonly administrativeCode: string;

  @ApiProperty({ example: '116803122001', description: '도로명 코드' })
  readonly roadNameCode: string;

  @ApiProperty({ example: '1168010500101430048000001', description: '건물관리번호' })
  readonly buildingManagementNumber: string;

  @ApiPropertyOptional({ example: 'GC타워', description: '건물명' })
  readonly buildingName?: string;

  @ApiPropertyOptional({ example: '서울특별시', description: '시/도명' })
  readonly city?: string;

  @ApiPropertyOptional({ example: '강남구', description: '시/군/구명' })
  readonly district?: string;

  @ApiPropertyOptional({ example: '삼성동', description: '읍/면/동명' })
  readonly town?: string;

  private constructor(params: {
    roadAddress: string;
    roadAddressPart1: string;
    roadAddressPart2: string;
    jibunAddress: string;
    englishAddress: string;
    zipCode: string;
    administrativeCode: string;
    roadNameCode: string;
    buildingManagementNumber: string;
    buildingName?: string;
    city?: string;
    district?: string;
    town?: string;
  }) {
    this.roadAddress = params.roadAddress;
    this.roadAddressPart1 = params.roadAddressPart1;
    this.roadAddressPart2 = params.roadAddressPart2;
    this.jibunAddress = params.jibunAddress;
    this.englishAddress = params.englishAddress;
    this.zipCode = params.zipCode;
    this.administrativeCode = params.administrativeCode;
    this.roadNameCode = params.roadNameCode;
    this.buildingManagementNumber = params.buildingManagementNumber;
    this.buildingName = params.buildingName;
    this.city = params.city;
    this.district = params.district;
    this.town = params.town;
  }

  static of(params: {
    roadAddress: string;
    roadAddressPart1: string;
    roadAddressPart2: string;
    jibunAddress: string;
    englishAddress: string;
    zipCode: string;
    administrativeCode: string;
    roadNameCode: string;
    buildingManagementNumber: string;
    buildingName?: string;
    city?: string;
    district?: string;
    town?: string;
  }): AddressSearchItemDto {
    return new AddressSearchItemDto(params);
  }
}

export class AddressSearchResultDto {
  @ApiProperty({ example: 124, description: '전체 검색 결과 수' })
  readonly totalCount: number;

  @ApiProperty({ example: 1, description: '현재 페이지 번호' })
  readonly currentPage: number;

  @ApiProperty({ example: 10, description: '페이지당 결과 수' })
  readonly countPerPage: number;

  @ApiProperty({ type: [AddressSearchItemDto], description: '주소 검색 결과 목록' })
  readonly items: AddressSearchItemDto[];

  private constructor(params: {
    totalCount: number;
    currentPage: number;
    countPerPage: number;
    items: AddressSearchItemDto[];
  }) {
    this.totalCount = params.totalCount;
    this.currentPage = params.currentPage;
    this.countPerPage = params.countPerPage;
    this.items = params.items;
  }

  static of(params: {
    totalCount: number;
    currentPage: number;
    countPerPage: number;
    items: AddressSearchItemDto[];
  }): AddressSearchResultDto {
    return new AddressSearchResultDto(params);
  }
}
