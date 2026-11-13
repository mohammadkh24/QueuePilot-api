import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configurations } from './config/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmDbConfig } from './config/typeorm-db-config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessModule } from './modules/business/business.module';
import { ServiceModule } from './modules/service/service.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { QueueModule } from './modules/queue/queue.module';
import { PublicModule } from './modules/public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load : configurations
    }),

    TypeOrmModule.forRootAsync({
      useClass: TypeOrmDbConfig,
      inject: [ConfigService],
    }),

    UserModule,

    AuthModule,

    BusinessModule,

    ServiceModule,

    AppointmentModule,

    QueueModule,
    PublicModule,
  ],

  
})
export class AppModule {}
