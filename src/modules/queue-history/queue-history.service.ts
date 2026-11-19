import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { QueueHistory } from './entities/queue-history.entity';
import { Queue } from '../queue/entities/queue.entity';
import { User } from '../user/entities/user.entity';

import { QueueEvent } from './enums/queue-event.enum';
import { QueueStatus } from '../queue/enums/queue-status.enum';

interface CreateQueueHistoryParams {
  manager: EntityManager;
  queue: Queue;
  event: QueueEvent;
  previousStatus: QueueStatus | null;
  newStatus: QueueStatus;
  changedById?: string | null;
}

@Injectable()
export class QueueHistoryService {
  async create(params: CreateQueueHistoryParams): Promise<QueueHistory> {
    const { manager, queue, event, previousStatus, newStatus, changedById } =
      params;

    const historyRepository = manager.getRepository(QueueHistory);

    const history = historyRepository.create({
      queue,
      event,
      previousStatus,
      newStatus,
      changedBy: changedById ? ({ id: changedById } as User) : null,
    });

    return historyRepository.save(history);
  }
}
