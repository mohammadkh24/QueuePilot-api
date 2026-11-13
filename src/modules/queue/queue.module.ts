
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Queue } from './entities/queue.entity';
import { Business } from '../business/entities/business.entity';
import { User } from '../user/entities/user.entity';
import { Appointment } from '../appointment/entities/appointment.entity';

import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Queue,
      Business,
      User,
      Appointment,
    ]),
    AuthModule,
  ],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
