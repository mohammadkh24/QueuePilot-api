import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Business } from './entities/business.entity';
import { User } from '../user/entities/user.entity';

import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

import { BusinessMessages } from '../../common/enums/messages.enum';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  // Create Business
  async create(createBusinessDto: CreateBusinessDto, ownerId: string) {
    const business = this.businessRepository.create({
      ...createBusinessDto,
      owner: { id: ownerId } as User,
    });

    const savedBusiness = await this.businessRepository.save(business);

    return {
      message: BusinessMessages.BUSINESS_CREATED,
      data: savedBusiness,
    };
  }

  // Get All Businesses
  async findAll(ownerId: string, search?: string, page = 1, limit = 10) {
    const currentPage = Math.max(1, page);
    const currentLimit = Math.min(100, Math.max(1, limit));

    const queryBuilder = this.businessRepository
      .createQueryBuilder('business')
      .leftJoin('business.owner', 'owner')
      .where('owner.id = :ownerId', { ownerId });

    if (search) {
      queryBuilder.andWhere(
        '(business.name ILIKE :search OR business.description ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    queryBuilder
      .orderBy('business.createdAt', 'DESC')
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

  // Get Business By ID
  async findOne(id: string, ownerId: string) {
    const business = await this.businessRepository.findOne({
      where: {
        id,
        owner: {
          id: ownerId,
        },
      },
    });

    if (!business) {
      throw new NotFoundException(BusinessMessages.BUSINESS_NOT_FOUND);
    }

    return {
      data: business,
    };
  }

  // Update Business
  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
    ownerId: string,
  ) {
    const business = await this.businessRepository.findOne({
      where: {
        id,
        owner: {
          id: ownerId,
        },
      },
    });

    if (!business) {
      throw new NotFoundException(BusinessMessages.BUSINESS_NOT_FOUND);
    }

    this.businessRepository.merge(business, updateBusinessDto);

    const updatedBusiness = await this.businessRepository.save(business);

    return {
      message: BusinessMessages.BUSINESS_UPDATED,
      data: updatedBusiness,
    };
  }

  // Delete Business
  async remove(id: string, ownerId: string) {
    const business = await this.businessRepository.findOne({
      where: {
        id,
        owner: {
          id: ownerId,
        },
      },
    });

    if (!business) {
      throw new NotFoundException(BusinessMessages.BUSINESS_NOT_FOUND);
    }

    await this.businessRepository.remove(business);

    return {
      message: BusinessMessages.BUSINESS_DELETED,
    };
  }
}
