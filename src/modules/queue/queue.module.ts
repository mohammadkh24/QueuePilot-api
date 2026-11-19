import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Queue } from './entities/queue.entity';
import { Business } from '../business/entities/business.entity';
import { User } from '../user/entities/user.entity';
import { Appointment } from '../appointment/entities/appointment.entity';

import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

import { AuthModule } from '../auth/auth.module';
import { QueueGateway } from './gateways/queue.gateway';
import { QueueHistoryModule } from '../queue-history/queue-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Queue, Business, User, Appointment]),
    AuthModule,
    QueueHistoryModule,
  ],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway],
  exports: [QueueService, QueueGateway],
})
export class QueueModule {}