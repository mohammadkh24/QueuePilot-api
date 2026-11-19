import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QueueHistory } from './entities/queue-history.entity';
import { QueueHistoryService } from './queue-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([QueueHistory])],
  providers: [QueueHistoryService],
  exports: [QueueHistoryService],
})
export class QueueHistoryModule {}