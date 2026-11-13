
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { Queue } from './entities/queue.entity';
import { Business } from '../business/entities/business.entity';
import { User } from '../user/entities/user.entity';
import { Appointment } from '../appointment/entities/appointment.entity';

import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueStatusDto } from './dto/update-queue.dto';

import { QueueMessages } from '../../common/enums/messages.enum';
import { QueueStatus } from './enums/queue-status.enum';
import { AppointmentStatus } from '../appointment/enums/appointment-status.enum';

import {
  QueueGateway,
  QueueEventPayload,
} from './gateways/queue.gateway';

@Injectable()
export class QueueService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly queueGateway: QueueGateway,
  ) {}

  // Create Queue Entry
  async create(
    businessId: string,
    ownerId: string,
    createQueueDto: CreateQueueDto,
  ) {
    const result = await this.dataSource.transaction(async (manager) => {
      const businessRepository = manager.getRepository(Business);
      const userRepository = manager.getRepository(User);
      const appointmentRepository = manager.getRepository(Appointment);
      const queueRepository = manager.getRepository(Queue);

      // Check Business Ownership And Lock Business
      const business = await businessRepository.findOne({
        where: {
          id: businessId,
          owner: { id: ownerId },
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!business) {
        throw new NotFoundException(QueueMessages.BUSINESS_NOT_FOUND);
      }

      // Check User
      const user = await userRepository.findOne({
        where: { id: createQueueDto.userId },
      });

      if (!user) {
        throw new NotFoundException(QueueMessages.USER_NOT_FOUND);
      }

      // Check Active Queue Entry
      const activeQueue = await queueRepository
        .createQueryBuilder('queue')
        .innerJoin('queue.business', 'business')
        .innerJoin('queue.user', 'user')
        .where('business.id = :businessId', { businessId })
        .andWhere('user.id = :userId', {
          userId: createQueueDto.userId,
        })
        .andWhere('queue.status IN (:...statuses)', {
          statuses: [
            QueueStatus.WAITING,
            QueueStatus.CALLED,
            QueueStatus.SERVING,
          ],
        })
        .getOne();

      if (activeQueue) {
        throw new ConflictException(QueueMessages.QUEUE_ALREADY_EXISTS);
      }

      let appointment: Appointment | null = null;

      // Check Optional Appointment
      if (createQueueDto.appointmentId) {
        appointment = await appointmentRepository.findOne({
          where: {
            id: createQueueDto.appointmentId,
          },
          relations: {
            business: true,
            user: true,
          },
        });

        if (!appointment || appointment.business.id !== businessId) {
          throw new NotFoundException(
            QueueMessages.APPOINTMENT_NOT_FOUND,
          );
        }

        if (appointment.user.id !== user.id) {
          throw new BadRequestException(
            QueueMessages.APPOINTMENT_NOT_FOUND,
          );
        }

        if (
          appointment.status === AppointmentStatus.CANCELLED ||
          appointment.status === AppointmentStatus.COMPLETED
        ) {
          throw new BadRequestException(
            QueueMessages.QUEUE_INVALID_STATUS,
          );
        }

        const existingQueue = await queueRepository.findOne({
          where: {
            appointment: { id: appointment.id },
          },
        });

        if (existingQueue) {
          throw new ConflictException(
            QueueMessages.APPOINTMENT_ALREADY_QUEUED,
          );
        }
      }

      // Generate Queue Number
      const lastQueue = await queueRepository
        .createQueryBuilder('queue')
        .innerJoin('queue.business', 'business')
        .where('business.id = :businessId', { businessId })
        .orderBy('queue.queueNumber', 'DESC')
        .getOne();

      const queueNumber = (lastQueue?.queueNumber ?? 0) + 1;

      // Create Queue Entry
      const queue = queueRepository.create({
        queueNumber,
        status: QueueStatus.WAITING,
        joinedAt: new Date(),
        business,
        user,
        appointment,
      });

      const savedQueue = await queueRepository.save(queue);

      return {
        response: {
          message: QueueMessages.QUEUE_CREATED,
          data: savedQueue,
        },
        eventPayload: this.createEventPayload(savedQueue, businessId),
      };
    });

    // Emit only after successful transaction commit
    this.queueGateway.emitQueueCreated(result.eventPayload);

    return result.response;
  }

  // Update Queue Status
  async updateStatus(
    businessId: string,
    queueId: string,
    ownerId: string,
    updateQueueStatusDto: UpdateQueueStatusDto,
  ) {
    const result = await this.dataSource.transaction(async (manager) => {
      const businessRepository = manager.getRepository(Business);
      const queueRepository = manager.getRepository(Queue);

      const business = await businessRepository.findOne({
        where: {
          id: businessId,
          owner: { id: ownerId },
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!business) {
        throw new NotFoundException(QueueMessages.BUSINESS_NOT_FOUND);
      }

      const queue = await queueRepository.findOne({
        where: {
          id: queueId,
          business: { id: businessId },
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!queue) {
        throw new NotFoundException(QueueMessages.QUEUE_NOT_FOUND);
      }

      const newStatus = updateQueueStatusDto.status;

      // Validate Status Transition
      const allowedTransitions: Record<QueueStatus, QueueStatus[]> = {
        [QueueStatus.WAITING]: [
          QueueStatus.CALLED,
          QueueStatus.CANCELLED,
        ],
        [QueueStatus.CALLED]: [
          QueueStatus.SERVING,
          QueueStatus.CANCELLED,
          QueueStatus.NO_SHOW,
        ],
        [QueueStatus.SERVING]: [
          QueueStatus.COMPLETED,
        ],
        [QueueStatus.COMPLETED]: [],
        [QueueStatus.CANCELLED]: [],
        [QueueStatus.NO_SHOW]: [],
      };

      if (!allowedTransitions[queue.status].includes(newStatus)) {
        throw new BadRequestException(
          QueueMessages.QUEUE_INVALID_STATUS,
        );
      }

      // Update Timestamps
      if (newStatus === QueueStatus.CALLED) {
        queue.calledAt = new Date();
      }

      if (newStatus === QueueStatus.SERVING) {
        queue.startedAt = new Date();
      }

      if (newStatus === QueueStatus.COMPLETED) {
        queue.completedAt = new Date();
      }

      queue.status = newStatus;

      const updatedQueue = await queueRepository.save(queue);

      return {
        response: {
          message: QueueMessages.QUEUE_UPDATED,
          data: updatedQueue,
        },
        eventPayload: this.createEventPayload(updatedQueue, businessId),
        newStatus,
      };
    });

    // Emit after transaction commit
    if (result.newStatus === QueueStatus.CANCELLED) {
      this.queueGateway.emitQueueCancelled(result.eventPayload);
    } else {
      this.queueGateway.emitQueueUpdated(result.eventPayload);
    }

    return result.response;
  }

  // Cancel Queue Entry
  async remove(
    businessId: string,
    queueId: string,
    ownerId: string,
  ) {
    const result = await this.dataSource.transaction(async (manager) => {
      const businessRepository = manager.getRepository(Business);
      const queueRepository = manager.getRepository(Queue);

      const business = await businessRepository.findOne({
        where: {
          id: businessId,
          owner: { id: ownerId },
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!business) {
        throw new NotFoundException(QueueMessages.BUSINESS_NOT_FOUND);
      }

      const queue = await queueRepository.findOne({
        where: {
          id: queueId,
          business: { id: businessId },
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!queue) {
        throw new NotFoundException(QueueMessages.QUEUE_NOT_FOUND);
      }

      if (
        queue.status === QueueStatus.COMPLETED ||
        queue.status === QueueStatus.CANCELLED ||
        queue.status === QueueStatus.NO_SHOW
      ) {
        throw new BadRequestException(
          QueueMessages.QUEUE_INVALID_STATUS,
        );
      }

      queue.status = QueueStatus.CANCELLED;

      const cancelledQueue = await queueRepository.save(queue);

      return {
        response: {
          message: QueueMessages.QUEUE_CANCELLED,
        },
        eventPayload: this.createEventPayload(
          cancelledQueue,
          businessId,
        ),
      };
    });

    // Emit after transaction commit
    this.queueGateway.emitQueueCancelled(result.eventPayload);

    return result.response;
  }

  // Create Safe Socket Event Payload
  private createEventPayload(
    queue: Queue,
    businessId: string,
  ): QueueEventPayload {
    return {
      id: queue.id,
      businessId,
      queueNumber: queue.queueNumber,
      status: queue.status,
      joinedAt: queue.joinedAt,
      calledAt: queue.calledAt,
      startedAt: queue.startedAt,
      completedAt: queue.completedAt,
    };
  }
}
