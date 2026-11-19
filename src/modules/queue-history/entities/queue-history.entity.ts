import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { Queue } from '../../queue/entities/queue.entity';
import { User } from '../../user/entities/user.entity';
import { QueueStatus } from '../../queue/enums/queue-status.enum';
import { QueueEvent } from '../enums/queue-event.enum';
import { entityName } from 'src/common/enums/entityName.enum';

@Entity(entityName.Queue_History)
export class QueueHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: QueueEvent,
  })
  event: QueueEvent;

  @Column({
    type: 'enum',
    enum: QueueStatus,
    nullable: true,
  })
  previousStatus: QueueStatus | null;

  @Column({
    type: 'enum',
    enum: QueueStatus,
  })
  newStatus: QueueStatus;

  @ManyToOne(() => Queue, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'queueId' })
  queue: Queue;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'changedById' })
  changedBy: User | null;

  @CreateDateColumn()
  changedAt: Date;
}
