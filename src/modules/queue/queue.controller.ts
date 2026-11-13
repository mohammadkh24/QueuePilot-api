
import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

import { Request } from 'express';

import { QueueService } from './queue.service';
import { CreateQueueDto } from './dto/create-queue.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateQueueStatusDto } from './dto/update-queue.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('businesses/:businessId/queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
  ) {}

  // Create Queue Entry
  @Post()
  @ApiOperation({
    summary: 'Add a customer to the business queue',
  })
  @ApiParam({
    name: 'businessId',
    description: 'Business UUID',
  })
  @ApiResponse({
    status: 201,
    description: 'Customer successfully added to queue',
  })
  @ApiResponse({
    status: 404,
    description: 'Business or user not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Customer already exists in active queue',
  })
  create(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() createQueueDto: CreateQueueDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.queueService.create(
      businessId,
      req.user.id,
      createQueueDto,
    );
  }

  // Update Queue Status
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update queue entry status',
  })
  @ApiParam({
    name: 'businessId',
    description: 'Business UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Queue entry UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue status successfully updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid queue status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Queue entry not found',
  })
  updateStatus(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQueueStatusDto: UpdateQueueStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.queueService.updateStatus(
      businessId,
      id,
      req.user.id,
      updateQueueStatusDto,
    );
  }

  // Cancel Queue Entry
  @Delete(':id')
  @ApiOperation({
    summary: 'Cancel a queue entry',
  })
  @ApiParam({
    name: 'businessId',
    description: 'Business UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Queue entry UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue entry successfully cancelled',
  })
  @ApiResponse({
    status: 404,
    description: 'Queue entry not found',
  })
  remove(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.queueService.remove(
      businessId,
      id,
      req.user.id,
    );
  }
}
