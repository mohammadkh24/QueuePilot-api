import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Queue } from '../queue/entities/queue.entity';
import { QueueStatus } from '../queue/enums/queue-status.enum';

@Injectable()
export class PredictionService {
  private readonly MINIMUM_SAMPLES = 3;
  constructor(
    @InjectRepository(Queue)
    private readonly queueRepository: Repository<Queue>,
  ) {}

  async getServiceDurationStats(businessId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const result = await this.queueRepository
      .createQueryBuilder('queue')
      .innerJoin('queue.business', 'business')
      .select('COUNT(queue.id)', 'sampleCount')
      .addSelect(
        `
        PERCENTILE_CONT(0.5)
        WITHIN GROUP (
          ORDER BY EXTRACT(
            EPOCH FROM (
              queue."completedAt" - queue."startedAt"
            )
          ) / 60
        )
        `,
        'medianMinutes',
      )
      .where('business.id = :businessId', { businessId })
      .andWhere('queue.status = :status', {
        status: QueueStatus.COMPLETED,
      })
      .andWhere('queue.startedAt IS NOT NULL')
      .andWhere('queue.completedAt IS NOT NULL')
      .andWhere('queue.completedAt >= :since', { since })
      .andWhere('queue.completedAt > queue.startedAt')
      .getRawOne();

    return {
      sampleCount: Number(result?.sampleCount ?? 0),
      medianMinutes:
        result?.medianMinutes !== null && result?.medianMinutes !== undefined
          ? Number(Number(result.medianMinutes).toFixed(2))
          : null,
    };
  }

  
async estimateWaitTime(businessId: string, queueId: string) {
  const activeQueues = await this.queueRepository
    .createQueryBuilder('queue')
    .innerJoin('queue.business', 'business')
    .where('business.id = :businessId', { businessId })
    .andWhere('queue.status IN (:...statuses)', {
      statuses: [
        QueueStatus.WAITING,
        QueueStatus.CALLED,
        QueueStatus.SERVING,
      ],
    })
    .orderBy('queue.queueNumber', 'ASC')
    .addOrderBy('queue.joinedAt', 'ASC')
    .getMany();

  const targetIndex = activeQueues.findIndex(
    (queue) => queue.id === queueId,
  );

  if (targetIndex === -1) {
    throw new NotFoundException('صف موردنظر پیدا نشد.');
  }

  const targetQueue = activeQueues[targetIndex];

  // مشتری در حال دریافت سرویس است.
  if (targetQueue.status === QueueStatus.SERVING) {
    return {
      queueId,
      status: targetQueue.status,
      aheadCount: 0,
      estimatedWaitMinutes: 0,
      estimatedStartAt: targetQueue.startedAt,
      sampleCount: 0,
    };
  }

  // مشتری قبلاً فراخوانی شده است.
  if (targetQueue.status === QueueStatus.CALLED) {
    return {
      queueId,
      status: targetQueue.status,
      aheadCount: targetIndex,
      estimatedWaitMinutes: 0,
      estimatedStartAt: new Date(),
      sampleCount: 0,
    };
  }

  const queuesAhead = activeQueues.slice(0, targetIndex);

  // اگر هیچ مشتری جلوتر وجود ندارد، زمان انتظار صف صفر است.
  if (queuesAhead.length === 0) {
    return {
      queueId,
      status: targetQueue.status,
      aheadCount: 0,
      estimatedWaitMinutes: 0,
      estimatedStartAt: new Date(),
      sampleCount: 0,
    };
  }

  const stats = await this.getServiceDurationStats(businessId);

  // بررسی کافی بودن داده تاریخی
  if (
    stats.sampleCount < this.MINIMUM_SAMPLES ||
    stats.medianMinutes === null
  ) {
    return {
      queueId,
      status: targetQueue.status,
      aheadCount: queuesAhead.length,
      estimatedWaitMinutes: null,
      estimatedStartAt: null,
      sampleCount: stats.sampleCount,
      message: 'داده کافی برای پیش‌بینی زمان انتظار وجود ندارد.',
    };
  }

  const now = new Date();

  let estimatedMinutes = 0;

  for (const queue of queuesAhead) {
    if (queue.status === QueueStatus.SERVING) {
      const elapsedMinutes = queue.startedAt
        ? (now.getTime() - new Date(queue.startedAt).getTime()) /
          60000
        : 0;

      estimatedMinutes += Math.max(
        0,
        stats.medianMinutes - elapsedMinutes,
      );
    } else {
      // WAITING و CALLED هر دو هنوز سرویس خود را دریافت نکرده‌اند.
      estimatedMinutes += stats.medianMinutes;
    }
  }

  const estimatedWaitMinutes = Math.ceil(estimatedMinutes);

  const estimatedStartAt = new Date(
    now.getTime() + estimatedMinutes * 60000,
  );

  return {
    queueId,
    status: targetQueue.status,
    aheadCount: queuesAhead.length,
    estimatedWaitMinutes,
    estimatedStartAt,
    sampleCount: stats.sampleCount,
  };
}

}
