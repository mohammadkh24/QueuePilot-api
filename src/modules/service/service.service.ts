
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Service } from './entities/service.entity';
import { Business } from '../business/entities/business.entity';

import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

import {
  BusinessMessages,
  ServiceMessages,
} from '../../common/enums/messages.enum';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  // Create Service
  async create(
    businessId: string,
    ownerId: string,
    createServiceDto: CreateServiceDto,
  ) {
    const business = await this.businessRepository.findOne({
      where: {
        id: businessId,
        owner: {
          id: ownerId,
        },
      },
    });

    if (!business) {
      throw new NotFoundException(
        BusinessMessages.BUSINESS_NOT_FOUND,
      );
    }

    const service = this.serviceRepository.create({
      ...createServiceDto,
      business,
    });

    const savedService = await this.serviceRepository.save(service);

    return {
      message: ServiceMessages.SERVICE_CREATED,
      data: savedService,
    };
  }

  // Get All Services Of A Business
  async findAll(
    businessId: string,
    ownerId: string,
    search?: string,
    page = 1,
    limit = 10,
  ) {
    const business = await this.businessRepository.findOne({
      where: {
        id: businessId,
        owner: {
          id: ownerId,
        },
      },
    });

    if (!business) {
      throw new NotFoundException(
        BusinessMessages.BUSINESS_NOT_FOUND,
      );
    }

    const currentPage = Math.max(1, page);
    const currentLimit = Math.min(100, Math.max(1, limit));

    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .where('service.businessId = :businessId', {
        businessId,
      });

    if (search?.trim()) {
      queryBuilder.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search)',
        {
          search: `%${search.trim()}%`,
        },
      );
    }

    queryBuilder
      .orderBy('service.createdAt', 'DESC')
      .skip((currentPage - 1) * currentLimit)
      .take(currentLimit);

    const [data, total] = await queryBuilder.getManyAndCount();

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

  // Get Service By ID
  async findOne(
    businessId: string,
    serviceId: string,
    ownerId: string,
  ) {
    const service = await this.serviceRepository.findOne({
      where: {
        id: serviceId,
        business: {
          id: businessId,
          owner: {
            id: ownerId,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(
        ServiceMessages.SERVICE_NOT_FOUND,
      );
    }

    return {
      data: service,
    };
  }

  // Update Service
  async update(
    businessId: string,
    serviceId: string,
    ownerId: string,
    updateServiceDto: UpdateServiceDto,
  ) {
    const service = await this.serviceRepository.findOne({
      where: {
        id: serviceId,
        business: {
          id: businessId,
          owner: {
            id: ownerId,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(
        ServiceMessages.SERVICE_NOT_FOUND,
      );
    }

    this.serviceRepository.merge(service, updateServiceDto);

    const updatedService = await this.serviceRepository.save(service);

    return {
      message: ServiceMessages.SERVICE_UPDATED,
      data: updatedService,
    };
  }

  // Delete Service
  async remove(
    businessId: string,
    serviceId: string,
    ownerId: string,
  ) {
    const service = await this.serviceRepository.findOne({
      where: {
        id: serviceId,
        business: {
          id: businessId,
          owner: {
            id: ownerId,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(
        ServiceMessages.SERVICE_NOT_FOUND,
      );
    }

    await this.serviceRepository.remove(service);

    return {
      message: ServiceMessages.SERVICE_DELETED,
    };
  }
}
