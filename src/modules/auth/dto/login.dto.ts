import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'mohammad@example.com',
    description: 'Registered email address.',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'StrongPass123',
    description: 'Account password.',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}