import type { AddressSearchPort } from '../ports';
import { type AddressSearchResultDto, SearchAddressesQuery } from '../dto';

export class SearchAddressesQueryHandler {
  constructor(private readonly addressSearch: AddressSearchPort) {}

  execute(query: SearchAddressesQuery): Promise<AddressSearchResultDto> {
    return this.addressSearch.search(query);
  }
}
