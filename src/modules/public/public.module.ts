import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity';
import { Service } from '../service/entities/service.entity';
import { PublicBusinessController } from './public-business.controller';
import { PublicBusinessService } from './public-business.service';

@Module({
  imports: [TypeOrmModule.forFeature([Business, Service])],
  controllers: [PublicBusinessController],
  providers: [PublicBusinessService],
})
export class PublicModule {}
