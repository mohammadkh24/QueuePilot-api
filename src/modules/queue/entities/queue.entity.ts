import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { Business } from '../../business/entities/business.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { entityName } from 'src/common/enums/entityName.enum';
import { QueueStatus } from '../enums/queue-status.enum';

@Entity(entityName.Queue)
export class Queue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  queueNumber: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customerPhone: string | null;

  @Column({
    type: 'enum',
    enum: QueueStatus,
    default: QueueStatus.WAITING,
  })
  status: QueueStatus;

  @Column({ type: 'timestamp' })
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  calledAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => Business, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @OneToOne(() => Appointment, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
