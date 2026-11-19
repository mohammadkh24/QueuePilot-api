import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AnalyticsService } from './analytics.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('businesses/:businessId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'دریافت آمار کلی صف کسب‌وکار' })
  @ApiParam({ name: 'businessId', description: 'شناسه کسب‌وکار' })
  @ApiQuery({ name: 'from', required: false, description: 'شروع بازه زمانی ISO 8601' })
  @ApiQuery({ name: 'to', required: false, description: 'پایان بازه زمانی ISO 8601' })
  getOverview(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query() query: AnalyticsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.analyticsService.getOverview(businessId, req.user.id, query);
  }

  @Get('daily')
  @ApiOperation({ summary: 'گزارش روزانه تعداد نوبت‌ها' })
  @ApiParam({ name: 'businessId', description: 'شناسه کسب‌وکار' })
  @ApiQuery({ name: 'from', required: false, description: 'شروع بازه زمانی ISO 8601' })
  @ApiQuery({ name: 'to', required: false, description: 'پایان بازه زمانی ISO 8601' })
  getDaily(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query() query: AnalyticsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.analyticsService.getDaily(businessId, req.user.id, query);
  }

  @Get('peak-hours')
  @ApiOperation({ summary: 'شناسایی ساعات پرتردد کسب‌وکار' })
  @ApiParam({ name: 'businessId', description: 'شناسه کسب‌وکار' })
  @ApiQuery({ name: 'from', required: false, description: 'شروع بازه زمانی ISO 8601' })
  @ApiQuery({ name: 'to', required: false, description: 'پایان بازه زمانی ISO 8601' })
  getPeakHours(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query() query: AnalyticsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.analyticsService.getPeakHours(businessId, req.user.id, query);
  }

  @Get('performance')
  @ApiOperation({ summary: 'گزارش میانگین زمان انتظار و خدمت و نرخ عملکرد' })
  @ApiParam({ name: 'businessId', description: 'شناسه کسب‌وکار' })
  @ApiQuery({ name: 'from', required: false, description: 'شروع بازه زمانی ISO 8601' })
  @ApiQuery({ name: 'to', required: false, description: 'پایان بازه زمانی ISO 8601' })
  getPerformance(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query() query: AnalyticsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.analyticsService.getPerformance(businessId, req.user.id, query);
  }
}
