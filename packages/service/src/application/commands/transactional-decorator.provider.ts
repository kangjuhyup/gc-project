import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { configureTransactionalDecorator } from './decorators';
import { TRANSACTION_MANAGER, type TransactionManagerPort } from './ports';

@Injectable()
export class TransactionalDecoratorProvider implements OnModuleInit {
  constructor(
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManagerPort,
  ) {}

  onModuleInit(): void {
    configureTransactionalDecorator(this.transactionManager);
  }
}
