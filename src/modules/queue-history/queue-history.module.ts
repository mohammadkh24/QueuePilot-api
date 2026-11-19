import { Module } from '@nestjs/common';

import { QueueHistoryService } from './queue-history.service';

@Module({
  providers: [QueueHistoryService],
  exports: [QueueHistoryService],
})
export class QueueHistoryModule {}