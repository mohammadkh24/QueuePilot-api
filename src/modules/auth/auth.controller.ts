import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { Request } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account using the provided information.',
  })
  @ApiCreatedResponse({
    description: 'User successfully registered.',
  })
  @ApiConflictResponse({
    description: 'A user with this email already exists.',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Authenticate a user',
    description:
      'Validates user credentials and returns authentication tokens.',
  })
  @ApiOkResponse({
    description: 'User successfully authenticated.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password.',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh authentication tokens',
    description:
      'Validates a refresh token and issues new authentication tokens.',
  })
  @ApiOkResponse({
    description: 'Tokens successfully refreshed.',
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is invalid or expired.',
  })
  refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout authenticated user',
    description: 'Invalidates the refresh token of the authenticated user.',
  })
  @ApiOkResponse({
    description: 'User successfully logged out.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing or invalid.',
  })
  logout(@Req() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get authenticated user profile',
    description: 'Retrieves the profile of the currently authenticated user.',
  })
  @ApiOkResponse({
    description: 'User profile successfully retrieved.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing or invalid.',
  })
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.id);
  }
}
