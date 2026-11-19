
import {
    Controller,
    Get,
    Param,
    UseGuards,
  } from '@nestjs/common';
  
  import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiTags,
  } from '@nestjs/swagger';
  
  import { PredictionService } from './prediction.service';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
 
  
  @ApiTags('Prediction')
  @ApiBearerAuth()
  @Controller('businesses/:businessId/predictions')
  @UseGuards(JwtAuthGuard)
  export class PredictionController {
    constructor(
      private readonly predictionService: PredictionService,
    ) {}
  
    @Get('queues/:queueId')
    @ApiOperation({
      summary: 'تخمین زمان انتظار مشتری در صف',
    })
    @ApiParam({
      name: 'businessId',
      description: 'شناسه کسب‌وکار',
    })
    @ApiParam({
      name: 'queueId',
      description: 'شناسه صف',
    })
    estimateWaitTime(
      @Param('businessId') businessId: string,
      @Param('queueId') queueId: string,
    ) {
      return this.predictionService.estimateWaitTime(
        businessId,
        queueId,
      );
    }
  }
  