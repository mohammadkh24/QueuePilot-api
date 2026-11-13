import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWalkInQueueDto {
  @ApiProperty({ example: 'علی رضایی', description: 'نام مراجعه‌کننده حضوری' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  customerName: string;

  @ApiPropertyOptional({ example: '09121234567', description: 'شماره تماس مراجعه‌کننده' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;
}
