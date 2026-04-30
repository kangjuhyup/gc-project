import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ADDRESS_SEARCH, type AddressSearchPort } from '@application/query/ports';
import { EnvironmentAdapterFlag } from '@infrastructure/config';
import { JusoAddressSearchAdapter } from './juso-address-search.adapter';
import { LocalAddressSearchAdapter } from './local-address-search.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    JusoAddressSearchAdapter,
    LocalAddressSearchAdapter,
    {
      provide: ADDRESS_SEARCH,
      useFactory: (
        configService: ConfigService,
        jusoAddressSearchAdapter: JusoAddressSearchAdapter,
        localAddressSearchAdapter: LocalAddressSearchAdapter,
      ): AddressSearchPort => {
        const fallbackAdapter = defaultAddressSearchAdapter({
          jusoAddressSearchAdapter,
          localAddressSearchAdapter,
          nodeEnv: configService.get<string>('NODE_ENV'),
        });

        return EnvironmentAdapterFlag.of({
          name: 'ADDRESS_SEARCH_ADAPTER',
          value: configService.get<string>('ADDRESS_SEARCH_ADAPTER'),
        }).select({
          adapters: {
            local: localAddressSearchAdapter,
            juso: jusoAddressSearchAdapter,
          },
          fallback: fallbackAdapter,
        });
      },
      inject: [ConfigService, JusoAddressSearchAdapter, LocalAddressSearchAdapter],
    },
  ],
  exports: [ADDRESS_SEARCH],
})
export class PublicApiModule {}

export function defaultAddressSearchAdapter(params: {
  jusoAddressSearchAdapter: AddressSearchPort;
  localAddressSearchAdapter: AddressSearchPort;
  nodeEnv?: string;
}): AddressSearchPort {
  return params.nodeEnv === 'development'
    ? params.localAddressSearchAdapter
    : params.jusoAddressSearchAdapter;
}
