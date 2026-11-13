
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from './entities/appointment.entity';
import { Business } from '../business/entities/business.entity';
import { Service } from '../service/entities/service.entity';

import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Business,
      Service,
    ]),
    AuthModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
