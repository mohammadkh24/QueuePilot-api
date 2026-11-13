import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { Appointment } from './entities/appointment.entity';
import { Business } from '../business/entities/business.entity';
import { Service } from '../service/entities/service.entity';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

import {
  AppointmentMessages,
  BusinessMessages,
  ServiceMessages,
} from '../../common/enums/messages.enum';
import { AppointmentStatus } from './enums/appointment-status.enum';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // Check Appointment Time Conflicts
  private async checkConflict(
    repository: any,
    businessId: string,
    startAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
  ) {
    const query = repository
      .createQueryBuilder('appointment')
      .innerJoin('appointment.business', 'business')
      .where('business.id = :businessId', { businessId })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      })
      .andWhere('appointment.startAt < :endAt', { endAt })
      .andWhere('appointment.endAt > :startAt', { startAt });

    if (excludeAppointmentId) {
      query.andWhere('appointment.id != :excludeAppointmentId', {
        excludeAppointmentId,
      });
    }

    const conflict = await query.getOne();

    if (conflict) {
      throw new ConflictException(AppointmentMessages.APPOINTMENT_CONFLICT);
    }
  }

  // Create Appointment
  async create(
    businessId: string,
    userId: string,
    createAppointmentDto: CreateAppointmentDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const businessRepository = manager.getRepository(Business);
      const serviceRepository = manager.getRepository(Service);
      const appointmentRepository = manager.getRepository(Appointment);

      const business = await businessRepository.findOne({
        where: { id: businessId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!business) {
        throw new NotFoundException(BusinessMessages.BUSINESS_NOT_FOUND);
      }

      const service = await serviceRepository.findOne({
        where: {
          id: createAppointmentDto.serviceId,
          business: { id: businessId },
        },
      });

      if (!service) {
        throw new NotFoundException(ServiceMessages.SERVICE_NOT_FOUND);
      }

      if (!service.isActive) {
        throw new BadRequestException(AppointmentMessages.SERVICE_INACTIVE);
      }

      const startAt = new Date(createAppointmentDto.startAt);

      if (startAt.getTime() <= Date.now()) {
        throw new BadRequestException(
          AppointmentMessages.APPOINTMENT_PAST_DATE,
        );
      }

      const endAt = new Date(startAt.getTime() + service.duration * 60 * 1000);

      await this.checkConflict(
        appointmentRepository,
        businessId,
        startAt,
        endAt,
      );

      const appointment = appointmentRepository.create({
        startAt,
        endAt,
        note: createAppointmentDto.note ?? null,
        status: AppointmentStatus.PENDING,
        user: { id: userId },
        business,
        service,
      });

      const savedAppointment = await appointmentRepository.save(appointment);

      return {
        message: AppointmentMessages.APPOINTMENT_CREATED,
        data: savedAppointment,
      };
    });
  }

  // Get All Appointments Of A Business
  async findAll(businessId: string, ownerId: string, page = 1, limit = 10) {
    const currentPage = Math.max(1, page);
    const currentLimit = Math.min(100, Math.max(1, limit));

    const repository = this.dataSource.getRepository(Appointment);

    const query = repository
      .createQueryBuilder('appointment')
      .innerJoin('appointment.business', 'business')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.user', 'user')
      .where('business.id = :businessId', { businessId })
      .andWhere('business.ownerId = :ownerId', { ownerId })
      .orderBy('appointment.startAt', 'ASC')
      .skip((currentPage - 1) * currentLimit)
      .take(currentLimit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    };
  }

  // Get Appointment By ID
  async findOne(businessId: string, appointmentId: string, ownerId: string) {
    const appointment = await this.dataSource
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .innerJoin('appointment.business', 'business')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.user', 'user')
      .where('appointment.id = :appointmentId', { appointmentId })
      .andWhere('business.id = :businessId', { businessId })
      .andWhere('business.ownerId = :ownerId', { ownerId })
      .getOne();

    if (!appointment) {
      throw new NotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND);
    }

    return { data: appointment };
  }

  // Update Appointment
  async update(
    businessId: string,
    appointmentId: string,
    ownerId: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const businessRepository = manager.getRepository(Business);
      const appointmentRepository = manager.getRepository(Appointment);

      const business = await businessRepository.findOne({
        where: {
          id: businessId,
          owner: { id: ownerId },
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!business) {
        throw new NotFoundException(BusinessMessages.BUSINESS_NOT_FOUND);
      }

      const appointment = await appointmentRepository.findOne({
        where: {
          id: appointmentId,
          business: { id: businessId },
        },
        relations: { service: true },
      });

      if (!appointment) {
        throw new NotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND);
      }

      if (
        appointment.status === AppointmentStatus.CANCELLED ||
        appointment.status === AppointmentStatus.COMPLETED
      ) {
        throw new BadRequestException(
          AppointmentMessages.INVALID_APPOINTMENT_TIME,
        );
      }

      if (updateAppointmentDto.startAt) {
        const startAt = new Date(updateAppointmentDto.startAt);

        if (startAt.getTime() <= Date.now()) {
          throw new BadRequestException(
            AppointmentMessages.APPOINTMENT_PAST_DATE,
          );
        }

        const endAt = new Date(
          startAt.getTime() + appointment.service.duration * 60 * 1000,
        );

        await this.checkConflict(
          appointmentRepository,
          businessId,
          startAt,
          endAt,
          appointmentId,
        );

        appointment.startAt = startAt;
        appointment.endAt = endAt;
      }

      if (updateAppointmentDto.note !== undefined) {
        appointment.note = updateAppointmentDto.note;
      }

      const updatedAppointment = await appointmentRepository.save(appointment);

      return {
        message: AppointmentMessages.APPOINTMENT_UPDATED,
        data: updatedAppointment,
      };
    });
  }

  // Delete Appointment
  async remove(businessId: string, appointmentId: string, ownerId: string) {
    const repository = this.dataSource.getRepository(Appointment);

    const appointment = await repository
      .createQueryBuilder('appointment')
      .innerJoin('appointment.business', 'business')
      .where('appointment.id = :appointmentId', { appointmentId })
      .andWhere('business.id = :businessId', { businessId })
      .andWhere('business.ownerId = :ownerId', { ownerId })
      .getOne();

    if (!appointment) {
      throw new NotFoundException(AppointmentMessages.APPOINTMENT_NOT_FOUND);
    }

    await repository.remove(appointment);

    return {
      message: AppointmentMessages.APPOINTMENT_CANCELLED,
    };
  }
}
