import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Business } from '../business/entities/business.entity';
import { Queue } from '../queue/entities/queue.entity';
import { QueueStatus } from '../queue/enums/queue-status.enum';
import { BusinessMessages } from '../../common/enums/messages.enum';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

type AnalyticsRange = {
  from: Date;
  to: Date;
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Queue)
    private readonly queueRepository: Repository<Queue>,

    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  private async assertBusinessOwner(businessId: string, ownerId: string) {
    const business = await this.businessRepository.findOne({
      where: {
        id: businessId,
        owner: { id: ownerId },
      },
      select: { id: true },
    });

    if (!business) {
      throw new NotFoundException(BusinessMessages.BUSINESS_NOT_FOUND);
    }
  }

  private createRange(query: AnalyticsQueryDto): AnalyticsRange {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException('تاریخ شروع نباید بعد از تاریخ پایان باشد.');
    }

    return { from, to };
  }

  private applyRange(
    queryBuilder: SelectQueryBuilder<Queue>,
    businessId: string,
    range: AnalyticsRange,
  ) {
    return queryBuilder
      .innerJoin('queue.business', 'business')
      .where('business.id = :businessId', { businessId })
      .andWhere('queue."joinedAt" >= :from', { from: range.from })
      .andWhere('queue."joinedAt" <= :to', { to: range.to });
  }

  private toNumber(value: unknown): number {
    return Number(value ?? 0);
  }

  private round(value: unknown): number {
    return Number(this.toNumber(value).toFixed(2));
  }

  async getOverview(
    businessId: string,
    ownerId: string,
    query: AnalyticsQueryDto,
  ) {
    await this.assertBusinessOwner(businessId, ownerId);
    const range = this.createRange(query);

    const raw = await this.applyRange(
      this.queueRepository.createQueryBuilder('queue'),
      businessId,
      range,
    )
      .select('COUNT(queue.id)', 'total')
      .addSelect(
        'COUNT(queue.id) FILTER (WHERE queue.status = :waiting)',
        'waiting',
      )
      .addSelect(
        'COUNT(queue.id) FILTER (WHERE queue.status = :called)',
        'called',
      )
      .addSelect(
        'COUNT(queue.id) FILTER (WHERE queue.status = :serving)',
        'serving',
      )
      .addSelect(
        'COUNT(queue.id) FILTER (WHERE queue.status = :completed)',
        'completed',
      )
      .addSelect(
        'COUNT(queue.id) FILTER (WHERE queue.status = :cancelled)',
        'cancelled',
      )
      .addSelect(
        'COUNT(queue.id) FILTER (WHERE queue.status = :noShow)',
        'noShow',
      )
      .setParameters({
        waiting: QueueStatus.WAITING,
        called: QueueStatus.CALLED,
        serving: QueueStatus.SERVING,
        completed: QueueStatus.COMPLETED,
        cancelled: QueueStatus.CANCELLED,
        noShow: QueueStatus.NO_SHOW,
      })
      .getRawOne();

    const total = this.toNumber(raw?.total);
    const completed = this.toNumber(raw?.completed);
    const cancelled = this.toNumber(raw?.cancelled);
    const noShow = this.toNumber(raw?.noShow);

    return {
      data: {
        range: {
          from: range.from,
          to: range.to,
        },
        total,
        statuses: {
          waiting: this.toNumber(raw?.waiting),
          called: this.toNumber(raw?.called),
          serving: this.toNumber(raw?.serving),
          completed,
          cancelled,
          noShow,
        },
        rates: {
          completion: this.round(total ? (completed / total) * 100 : 0),
          cancellation: this.round(total ? (cancelled / total) * 100 : 0),
          noShow: this.round(total ? (noShow / total) * 100 : 0),
        },
      },
    };
  }

  async getDaily(
    businessId: string,
    ownerId: string,
    query: AnalyticsQueryDto,
  ) {
    await this.assertBusinessOwner(businessId, ownerId);
    const range = this.createRange(query);

    const rows = await this.applyRange(
      this.queueRepository.createQueryBuilder('queue'),
      businessId,
      range,
    )
      .select(`DATE_TRUNC('day', queue."joinedAt")`, 'date')
      .addSelect('COUNT(queue.id)', 'total')
      .addSelect(
        'COUNT(queue.id) FILTER (WHERE queue.status = :completed)',
        'completed',
      )
      .addSelect(
        'COUNT(queue.id) FILTER (WHERE queue.status = :cancelled)',
        'cancelled',
      )
      .addSelect(
        'COUNT(queue.id) FILTER (WHERE queue.status = :noShow)',
        'noShow',
      )
      .setParameters({
        completed: QueueStatus.COMPLETED,
        cancelled: QueueStatus.CANCELLED,
        noShow: QueueStatus.NO_SHOW,
      })
      .groupBy(`DATE_TRUNC('day', queue."joinedAt")`)
      .orderBy(`DATE_TRUNC('day', queue."joinedAt")`, 'ASC')
      .getRawMany();

    return {
      data: rows.map((row) => ({
        date: row.date,
        total: this.toNumber(row.total),
        completed: this.toNumber(row.completed),
        cancelled: this.toNumber(row.cancelled),
        noShow: this.toNumber(row.noShow),
      })),
      meta: {
        from: range.from,
        to: range.to,
      },
    };
  }

  async getPeakHours(
    businessId: string,
    ownerId: string,
    query: AnalyticsQueryDto,
  ) {
    await this.assertBusinessOwner(businessId, ownerId);
    const range = this.createRange(query);

    const rows = await this.applyRange(
      this.queueRepository.createQueryBuilder('queue'),
      businessId,
      range,
    )
      .select('EXTRACT(HOUR FROM queue."joinedAt")', 'hour')
      .addSelect('COUNT(queue.id)', 'total')
      .groupBy('EXTRACT(HOUR FROM queue."joinedAt")')
      .orderBy('total', 'DESC')
      .addOrderBy('hour', 'ASC')
      .getRawMany();

    return {
      data: rows.map((row) => ({
        hour: this.toNumber(row.hour),
        total: this.toNumber(row.total),
      })),
      meta: {
        from: range.from,
        to: range.to,
        timezone: 'database',
      },
    };
  }

  async getPerformance(
    businessId: string,
    ownerId: string,
    query: AnalyticsQueryDto,
  ) {
    await this.assertBusinessOwner(businessId, ownerId);
    const range = this.createRange(query);

    const raw = await this.applyRange(
      this.queueRepository.createQueryBuilder('queue'),
      businessId,
      range,
    )
      .select(
        `AVG(EXTRACT(EPOCH FROM (queue."startedAt" - queue."joinedAt")) / 60)
         FILTER (WHERE queue."startedAt" IS NOT NULL
           AND queue."startedAt" >= queue."joinedAt")`,
        'averageWaitMinutes',
      )
      .addSelect(
        `COUNT(queue.id) FILTER (WHERE queue."startedAt" IS NOT NULL
          AND queue."startedAt" >= queue."joinedAt")`,
        'waitSampleCount',
      )
      .addSelect(
        `AVG(EXTRACT(EPOCH FROM (queue."completedAt" - queue."startedAt")) / 60)
         FILTER (WHERE queue.status = :completed
           AND queue."startedAt" IS NOT NULL
           AND queue."completedAt" IS NOT NULL
           AND queue."completedAt" > queue."startedAt")`,
        'averageServiceMinutes',
      )
      .addSelect(
        `COUNT(queue.id) FILTER (WHERE queue.status = :completed
          AND queue."startedAt" IS NOT NULL
          AND queue."completedAt" IS NOT NULL
          AND queue."completedAt" > queue."startedAt")`,
        'serviceSampleCount',
      )
      .addSelect('COUNT(queue.id)', 'total')
      .addSelect(
        'COUNT(queue.id) FILTER (WHERE queue.status = :completed)',
        'completed',
      )
      .addSelect(
        'COUNT(queue.id) FILTER (WHERE queue.status = :cancelled)',
        'cancelled',
      )
      .addSelect(
        'COUNT(queue.id) FILTER (WHERE queue.status = :noShow)',
        'noShow',
      )
      .setParameters({
        completed: QueueStatus.COMPLETED,
        cancelled: QueueStatus.CANCELLED,
        noShow: QueueStatus.NO_SHOW,
      })
      .getRawOne();

    const total = this.toNumber(raw?.total);

    return {
      data: {
        averageWaitMinutes:
          raw?.averageWaitMinutes === null || raw?.averageWaitMinutes === undefined
            ? null
            : this.round(raw.averageWaitMinutes),
        waitSampleCount: this.toNumber(raw?.waitSampleCount),
        averageServiceMinutes:
          raw?.averageServiceMinutes === null ||
          raw?.averageServiceMinutes === undefined
            ? null
            : this.round(raw.averageServiceMinutes),
        serviceSampleCount: this.toNumber(raw?.serviceSampleCount),
        rates: {
          completion: this.round(
            total ? (this.toNumber(raw?.completed) / total) * 100 : 0,
          ),
          cancellation: this.round(
            total ? (this.toNumber(raw?.cancelled) / total) * 100 : 0,
          ),
          noShow: this.round(
            total ? (this.toNumber(raw?.noShow) / total) * 100 : 0,
          ),
        },
      },
      meta: {
        from: range.from,
        to: range.to,
      },
    };
  }
}
