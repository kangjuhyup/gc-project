import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AddressSearchItemDto,
  AddressSearchResultDto,
  SearchAddressesQuery,
} from '@application/query/dto';
import type { AddressSearchPort } from '@application/query/ports';

interface LocalAddressItem {
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
}

@Injectable()
@Logging
export class LocalAddressSearchAdapter implements AddressSearchPort {
  private readonly addresses: LocalAddressItem[];

  constructor() {
    this.addresses = this.loadAddresses();
  }

  async search(query: SearchAddressesQuery): Promise<AddressSearchResultDto> {
    const keyword = query.keyword.trim().toLocaleLowerCase();
    const matched = this.addresses.filter((address) => this.matches(address, keyword));
    const offset = (query.currentPage - 1) * query.countPerPage;
    const paged = matched.slice(offset, offset + query.countPerPage);

    return AddressSearchResultDto.of({
      totalCount: matched.length,
      currentPage: query.currentPage,
      countPerPage: query.countPerPage,
      items: paged.map((item) => this.toDto(item)),
    });
  }

  @NoLog
  private matches(address: LocalAddressItem, keyword: string): boolean {
    return [
      address.roadAddress,
      address.roadAddressPart1,
      address.roadAddressPart2,
      address.jibunAddress,
      address.englishAddress,
      address.zipCode,
      address.buildingName,
      address.city,
      address.district,
      address.town,
    ].some((value) => value?.toLocaleLowerCase().includes(keyword) ?? false);
  }

  @NoLog
  private toDto(item: LocalAddressItem): AddressSearchItemDto {
    return AddressSearchItemDto.of({
      roadAddress: item.roadAddress,
      roadAddressPart1: item.roadAddressPart1,
      roadAddressPart2: item.roadAddressPart2,
      jibunAddress: item.jibunAddress,
      englishAddress: item.englishAddress,
      zipCode: item.zipCode,
      administrativeCode: item.administrativeCode,
      roadNameCode: item.roadNameCode,
      buildingManagementNumber: item.buildingManagementNumber,
      buildingName: item.buildingName,
      city: item.city,
      district: item.district,
      town: item.town,
    });
  }

  @NoLog
  private loadAddresses(): LocalAddressItem[] {
    const content = readFileSync(join(__dirname, 'local-addresses.json'), 'utf8');
    return JSON.parse(content) as LocalAddressItem[];
  }
}
