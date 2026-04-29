import { Logging } from '@kangjuhyup/rvlog';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AddressSearchItemDto,
  AddressSearchResultDto,
  SearchAddressesQuery,
} from '@application/query/dto';
import type { AddressSearchPort } from '@application/query/ports';

interface JusoApiResponse {
  results?: {
    common?: {
      totalCount?: string;
      currentPage?: string;
      countPerPage?: string;
      errorCode?: string;
      errorMessage?: string;
    };
    juso?: JusoAddressItem[];
  };
}

interface JusoAddressItem {
  roadAddr?: string;
  roadAddrPart1?: string;
  roadAddrPart2?: string;
  jibunAddr?: string;
  engAddr?: string;
  zipNo?: string;
  admCd?: string;
  rnMgtSn?: string;
  bdMgtSn?: string;
  bdNm?: string;
  siNm?: string;
  sggNm?: string;
  emdNm?: string;
}

@Injectable()
@Logging
export class JusoAddressSearchAdapter implements AddressSearchPort {
  constructor(private readonly configService: ConfigService) {}

  async search(query: SearchAddressesQuery): Promise<AddressSearchResultDto> {
    const response = await fetch(this.buildUrl(query));

    if (!response.ok) {
      throw new Error('ADDRESS_SEARCH_FAILED');
    }

    const payload = await response.json() as JusoApiResponse;
    const common = payload.results?.common;

    if (common?.errorCode !== '0') {
      throw new Error('ADDRESS_SEARCH_FAILED');
    }

    return AddressSearchResultDto.of({
      totalCount: Number(common.totalCount ?? 0),
      currentPage: Number(common.currentPage ?? query.currentPage),
      countPerPage: Number(common.countPerPage ?? query.countPerPage),
      items: (payload.results?.juso ?? []).map((item) => this.toDto(item)),
    });
  }

  private buildUrl(query: SearchAddressesQuery): URL {
    const url = new URL('https://business.juso.go.kr/addrlink/addrLinkApi.do');
    url.searchParams.set('confmKey', this.configService.getOrThrow<string>('JUSO_API_KEY'));
    url.searchParams.set('currentPage', String(query.currentPage));
    url.searchParams.set('countPerPage', String(query.countPerPage));
    url.searchParams.set('keyword', query.keyword);
    url.searchParams.set('resultType', 'json');
    return url;
  }

  private toDto(item: JusoAddressItem): AddressSearchItemDto {
    return AddressSearchItemDto.of({
      roadAddress: item.roadAddr ?? '',
      roadAddressPart1: item.roadAddrPart1 ?? '',
      roadAddressPart2: item.roadAddrPart2 ?? '',
      jibunAddress: item.jibunAddr ?? '',
      englishAddress: item.engAddr ?? '',
      zipCode: item.zipNo ?? '',
      administrativeCode: item.admCd ?? '',
      roadNameCode: item.rnMgtSn ?? '',
      buildingManagementNumber: item.bdMgtSn ?? '',
      buildingName: item.bdNm === '' ? undefined : item.bdNm,
      city: item.siNm === '' ? undefined : item.siNm,
      district: item.sggNm === '' ? undefined : item.sggNm,
      town: item.emdNm === '' ? undefined : item.emdNm,
    });
  }
}
