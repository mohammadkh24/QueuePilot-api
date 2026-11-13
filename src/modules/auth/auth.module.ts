import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { User } from '../user/entities/user.entity';
import { configKeys } from 'src/config/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>(
          `${configKeys.Jwt}.accessTokenSecret`,
        );

        if (!secret) {
          throw new Error('ACCESS_TOKEN_SECRET is not configured');
        }

        return {
          secret,
          signOptions: {
            expiresIn: '15m',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, PassportModule , JwtModule],
})
export class AuthModule {}