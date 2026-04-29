import { Module } from '@nestjs/common';
import { CommandModule } from './commands/command.module';
import { QueryModule } from './query/query.module';

@Module({
  imports: [CommandModule, QueryModule],
  exports: [CommandModule, QueryModule],
})
export class ApplicationModule {}
