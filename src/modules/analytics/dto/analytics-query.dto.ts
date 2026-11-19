import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'شروع بازه زمانی به فرمت ISO 8601',
    example: '2026-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'فرمت تاریخ شروع معتبر نیست.' },
  )
  from?: string;

  @ApiPropertyOptional({
    description: 'پایان بازه زمانی به فرمت ISO 8601',
    example: '2026-11-19T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'فرمت تاریخ پایان معتبر نیست.' },
  )
  to?: string;
}
