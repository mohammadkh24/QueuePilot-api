import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthMessages } from '../../common/enums/messages.enum';
import { configKeys } from 'src/config/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getRefreshSecret(): string {
    const secret = this.configService.get<string>(
      `${configKeys.Jwt}.refreshTokenSecret`,
    );

    if (!secret) {
      throw new Error('REFRESH_TOKEN_SECRET is not configured');
    }

    return secret;
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      email,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
        tokenType: 'refresh',
      },
      {
        secret: this.getRefreshSecret(),
        expiresIn: '7d',
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.userRepository.update(userId, {
      refreshTokenHash,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(registerDto: RegisterDto) {
    const { password } = registerDto;
    const email = registerDto.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(AuthMessages.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = this.userRepository.create({
      ...registerDto,
      email,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    const { password: _, ...result } = savedUser;

    return {
      message: AuthMessages.REGISTER_SUCCESS,
      data: result,
    };
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const { password } = loginDto;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException(AuthMessages.INVALID_CREDENTIALS);
    }

    const tokens = await this.generateTokens(user.id, user.email);

    const { password: _, ...result } = user;

    return {
      message: AuthMessages.LOGIN_SUCCESS,
      data: {
        user: result,
        ...tokens,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: {
      sub: string;
      email: string;
      tokenType: string;
    };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException(AuthMessages.REFRESH_TOKEN_INVALID);
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException(AuthMessages.REFRESH_TOKEN_INVALID);
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id: payload.sub })
      .getOne();

    if (
      !user ||
      !user.refreshTokenHash ||
      !(await bcrypt.compare(refreshToken, user.refreshTokenHash))
    ) {
      throw new UnauthorizedException(AuthMessages.REFRESH_TOKEN_INVALID);
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      data: tokens,
    };
  }

  async logout(userId: string) {
    await this.userRepository.update(userId, {
      refreshTokenHash: null,
    });

    return {
      message: AuthMessages.LOGOUT_SUCCESS,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(AuthMessages.INVALID_CREDENTIALS);
    }

    const { password: _, ...result } = user;

    return {
      data: result,
    };
  }
}
