import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { Server, Socket } from 'socket.io';
import { isUUID } from 'class-validator';

import { Business } from '../../business/entities/business.entity';
import { Queue } from '../entities/queue.entity';
import { QueueStatus } from '../enums/queue-status.enum';

interface SocketUser {
  id: string;
  email: string;
}

interface JoinQueuePayload {
  businessId: string;
}

export interface QueueEventPayload {
  id: string;
  businessId: string;
  queueNumber: number;
  status: QueueStatus;
  joinedAt: Date;
  calledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

@WebSocketGateway({
  namespace: '/queue',
  cors: {
    origin: '*',
  },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authToken = client.handshake.auth?.token;

      const authorization = client.handshake.headers.authorization;

      const headerToken =
        typeof authorization === 'string'
          ? authorization.replace(/^Bearer\s+/i, '')
          : undefined;

      const token = authToken || headerToken;

      if (!token || typeof token !== 'string') {
        throw new Error('Missing token');
      }

      const secret = this.configService.get<string>('jwt.accessTokenSecret');

      if (!secret) {
        throw new Error('JWT secret is not configured');
      }

      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(token, { secret });

      if (!payload.sub || !payload.email) {
        throw new Error('Invalid token payload');
      }

      client.data.user = {
        id: payload.sub,
        email: payload.email,
      } satisfies SocketUser;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    // Socket.IO automatically removes disconnected clients from rooms.
  }

  @SubscribeMessage('queue:join')
  async handleJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinQueuePayload,
  ) {
    const user = client.data.user as SocketUser | undefined;

    if (!user) {
      throw new WsException('Unauthorized');
    }

    if (!payload || !isUUID(payload.businessId)) {
      throw new WsException('Invalid business ID');
    }

    const { businessId } = payload;

    // Check whether the user owns this business.
    const business = await this.dataSource.getRepository(Business).findOne({
      where: {
        id: businessId,
        owner: {
          id: user.id,
        },
      },
    });

    // Business owner can join directly.
    if (business) {
      await client.join(`business:${businessId}`);

      return {
        message: 'Joined business queue successfully',
        businessId,
      };
    }

    // Customers must have an active queue entry.
    const queueEntry = await this.dataSource
      .getRepository(Queue)
      .createQueryBuilder('queue')
      .innerJoin('queue.business', 'business')
      .innerJoin('queue.user', 'user')
      .where('business.id = :businessId', { businessId })
      .andWhere('user.id = :userId', {
        userId: user.id,
      })
      .andWhere('queue.status IN (:...statuses)', {
        statuses: [
          QueueStatus.WAITING,
          QueueStatus.CALLED,
          QueueStatus.SERVING,
        ],
      })
      .getOne();

    if (!queueEntry) {
      throw new WsException('Forbidden');
    }

    await client.join(`business:${businessId}`);

    return {
      message: 'Joined business queue successfully',
      businessId,
    };
  }

  @SubscribeMessage('queue:leave')
  async handleLeaveQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinQueuePayload,
  ) {
    const user = client.data.user as SocketUser | undefined;

    if (!user) {
      throw new WsException('Unauthorized');
    }

    if (!payload || !isUUID(payload.businessId)) {
      throw new WsException('Invalid business ID');
    }

    await client.leave(`business:${payload.businessId}`);

    return {
      message: 'Left business queue successfully',
      businessId: payload.businessId,
    };
  }

  // Emit when a new customer joins the queue.
  emitQueueCreated(payload: QueueEventPayload) {
    this.server
      .to(`business:${payload.businessId}`)
      .emit('queue:created', payload);
  }

  // Emit when a queue entry status changes.
  emitQueueUpdated(payload: QueueEventPayload) {
    this.server
      .to(`business:${payload.businessId}`)
      .emit('queue:updated', payload);
  }

  // Emit when a queue entry is cancelled.
  emitQueueCancelled(payload: QueueEventPayload) {
    this.server
      .to(`business:${payload.businessId}`)
      .emit('queue:cancelled', payload);
  }
}
