
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'Service UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  serviceId: string;

  @ApiProperty({
    description: 'Appointment start date and time in ISO 8601 format',
    example: '2026-11-15T10:00:00.000Z',
  })
  @IsDateString()
  startAt: string;

  @ApiPropertyOptional({
    description: 'Additional appointment notes',
    example: 'Please arrive 10 minutes early',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
