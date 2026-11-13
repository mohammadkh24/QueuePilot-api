import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity';
import { Service } from '../service/entities/service.entity';

@Injectable()
export class PublicBusinessService {
  constructor(
    @InjectRepository(Business) private readonly businesses: Repository<Business>,
    @InjectRepository(Service) private readonly services: Repository<Service>,
  ) {}

  async findBusinesses(search = '', page = 1, limit = 12) {
    const currentPage = Math.max(1, page);
    const currentLimit = Math.min(50, Math.max(1, limit));
    const query = this.businesses.createQueryBuilder('business')
      .where('business.isActive = :active', { active: true });
    if (search.trim()) {
      query.andWhere('(business.name ILIKE :search OR business.description ILIKE :search)', { search: `%${search.trim()}%` });
    }
    const [data, total] = await query.orderBy('business.createdAt', 'DESC')
      .skip((currentPage - 1) * currentLimit).take(currentLimit).getManyAndCount();
    return { data, meta: { total, page: currentPage, limit: currentLimit, totalPages: Math.ceil(total / currentLimit) } };
  }

  async findBusiness(id: string) {
    const data = await this.businesses.findOne({ where: { id, isActive: true } });
    if (!data) throw new NotFoundException('کسب‌وکار پیدا نشد.');
    return { data };
  }

  async findServices(businessId: string) {
    const business = await this.businesses.findOne({ where: { id: businessId, isActive: true } });
    if (!business) throw new NotFoundException('کسب‌وکار پیدا نشد.');
    const data = await this.services.find({ where: { business: { id: businessId }, isActive: true }, order: { createdAt: 'DESC' } });
    return { data };
  }
}
