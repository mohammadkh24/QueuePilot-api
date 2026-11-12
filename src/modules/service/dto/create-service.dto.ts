
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Haircut',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'Professional haircut service',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 30,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Service price',
    example: 250000,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}
