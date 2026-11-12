
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({
    description: 'Business name',
    example: 'QueuePilot Barbershop',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description: 'Business description',
    example: 'Professional barbershop services',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Business contact phone number',
    example: '+989121234567',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Business physical address',
    example: 'Tehran, Iran',
  })
  @IsOptional()
  @IsString()
  address?: string;
}
