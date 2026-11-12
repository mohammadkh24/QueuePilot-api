import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Service } from './entities/service.entity';
import { Business } from '../business/entities/business.entity';

import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Business]), AuthModule],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class ServiceModule {}
