import type { AddressSearchResultDto, SearchAddressesQuery } from '../dto';

export const ADDRESS_SEARCH = Symbol('ADDRESS_SEARCH');

export interface AddressSearchPort {
  search(query: SearchAddressesQuery): Promise<AddressSearchResultDto>;
}
