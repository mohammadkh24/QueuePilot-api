
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({
    description: 'New appointment start date and time',
    example: '2026-11-15T11:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({
    description: 'Updated appointment notes',
    example: 'Customer requested a different time',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
