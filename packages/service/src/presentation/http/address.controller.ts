import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddressSearchResultDto, QueryBus, SearchAddressesQuery } from '@application';
import { SearchAddressesRequestDto } from '../dto';

@ApiTags('Addresses')
@Controller('/api/addresses')
export class AddressController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiOperation({
    summary: '주소 검색',
    description:
      '공공 주소 API를 통해 주소를 검색합니다. 회원가입 화면의 주소 선택 모달에서 사용합니다.',
  })
  @ApiOkResponse({ type: AddressSearchResultDto, description: '주소 검색 결과' })
  @ApiBadRequestResponse({
    description: '검색어 길이/페이지 파라미터가 유효하지 않거나 공공 주소 API가 오류를 반환한 경우',
  })
  @Get()
  search(@Query() query: SearchAddressesRequestDto) {
    const request = SearchAddressesRequestDto.of(query);
    return this.queryBus.execute(
      SearchAddressesQuery.of({
        keyword: request.keyword,
        currentPage: request.currentPage,
        countPerPage: request.countPerPage,
      }),
    );
  }
}
