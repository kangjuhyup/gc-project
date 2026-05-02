import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ADDRESS_SEARCH, type AddressSearchPort } from '@application/query/ports';
import { ENV_KEY } from '@infrastructure/config';
import { JusoAddressSearchAdapter } from './juso-address-search.adapter';
import { LocalAddressSearchAdapter } from './local-address-search.adapter';

@Module({
  providers: [
    LocalAddressSearchAdapter,
    {
      provide: ADDRESS_SEARCH,
      useFactory: (
        configService: ConfigService,
        localAddressSearchAdapter: LocalAddressSearchAdapter,
      ): AddressSearchPort => {
        const adapterName = configService.getOrThrow<'local' | 'juso'>(
          ENV_KEY.ADDRESS_SEARCH_ADAPTER,
        );

        if (adapterName === 'local') {
          return localAddressSearchAdapter;
        }

        return new JusoAddressSearchAdapter(configService.getOrThrow<string>(ENV_KEY.JUSO_API_KEY));
      },
      inject: [ConfigService, LocalAddressSearchAdapter],
    },
  ],
  exports: [ADDRESS_SEARCH],
})
export class PublicApiModule {}
