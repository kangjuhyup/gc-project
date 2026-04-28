import { Controller, Get, Query } from '@nestjs/common';
import { SearchAddressesQuery, SearchAddressesQueryHandler } from '@application';
import { SearchAddressesRequestDto } from '../dto';

@Controller('/api/addresses')
export class AddressController {
  constructor(private readonly searchAddressesQueryHandler: SearchAddressesQueryHandler) {}

  @Get()
  search(@Query() query: SearchAddressesRequestDto) {
    const request = SearchAddressesRequestDto.of(query);
    return this.searchAddressesQueryHandler.execute(
      SearchAddressesQuery.of({
        keyword: request.keyword,
        currentPage: request.currentPage,
        countPerPage: request.countPerPage,
      }),
    );
  }
}
