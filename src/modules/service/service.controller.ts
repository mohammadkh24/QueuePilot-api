import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { Request } from 'express';

import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('businesses/:businessId/services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  // Create Service
  @Post()
  @ApiOperation({ summary: 'Create a service for a business' })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  create(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() createServiceDto: CreateServiceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceService.create(
      businessId,
      req.user.id,
      createServiceDto,
    );
  }

  // Get All Services
  @Get()
  @ApiOperation({ summary: 'Get all services of a business' })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by service name or description',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  findAll(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.serviceService.findAll(
      businessId,
      req.user.id,
      search,
      Number(page),
      Number(limit),
    );
  }

  // Get Service By ID
  @Get(':id')
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  findOne(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) serviceId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceService.findOne(businessId, serviceId, req.user.id);
  }

  // Update Service
  @Patch(':id')
  @ApiOperation({ summary: 'Update a service' })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  update(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) serviceId: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceService.update(
      businessId,
      serviceId,
      req.user.id,
      updateServiceDto,
    );
  }

  // Delete Service
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service' })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  remove(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) serviceId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceService.remove(businessId, serviceId, req.user.id);
  }
}
