export class AddressSearchItemDto {
  private constructor(
    readonly roadAddress: string,
    readonly roadAddressPart1: string,
    readonly roadAddressPart2: string,
    readonly jibunAddress: string,
    readonly englishAddress: string,
    readonly zipCode: string,
    readonly administrativeCode: string,
    readonly roadNameCode: string,
    readonly buildingManagementNumber: string,
    readonly buildingName?: string,
    readonly city?: string,
    readonly district?: string,
    readonly town?: string,
  ) {}

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
    return new AddressSearchItemDto(
      params.roadAddress,
      params.roadAddressPart1,
      params.roadAddressPart2,
      params.jibunAddress,
      params.englishAddress,
      params.zipCode,
      params.administrativeCode,
      params.roadNameCode,
      params.buildingManagementNumber,
      params.buildingName,
      params.city,
      params.district,
      params.town,
    );
  }
}

export class AddressSearchResultDto {
  private constructor(
    readonly totalCount: number,
    readonly currentPage: number,
    readonly countPerPage: number,
    readonly items: AddressSearchItemDto[],
  ) {}

  static of(params: {
    totalCount: number;
    currentPage: number;
    countPerPage: number;
    items: AddressSearchItemDto[];
  }): AddressSearchResultDto {
    return new AddressSearchResultDto(
      params.totalCount,
      params.currentPage,
      params.countPerPage,
      params.items,
    );
  }
}
