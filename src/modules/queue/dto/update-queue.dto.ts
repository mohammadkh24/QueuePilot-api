
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { QueueStatus } from '../enums/queue-status.enum';


export class UpdateQueueStatusDto {
  @ApiProperty({
    description: 'New queue entry status',
    enum: QueueStatus,
    example: QueueStatus.CALLED,
  })
  @IsEnum(QueueStatus)
  status: QueueStatus;
}
