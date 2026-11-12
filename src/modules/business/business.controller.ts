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

import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Businesses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('businesses')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // Create Business
  @Post()
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({ status: 201, description: 'Business created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createBusinessDto: CreateBusinessDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.businessService.create(createBusinessDto, req.user.id);
  }

  // Get All Businesses
  @Get()
  @ApiOperation({ summary: 'Get all businesses owned by the current user' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by business name or description',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Businesses retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.businessService.findAll(
      req.user.id,
      search,
      Number(page),
      Number(limit),
    );
  }

  // Get Business By ID
  @Get(':id')
  @ApiOperation({ summary: 'Get a business by ID' })
  @ApiParam({ name: 'id', description: 'Business UUID' })
  @ApiResponse({ status: 200, description: 'Business retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.businessService.findOne(id, req.user.id);
  }

  // Update Business
  @Patch(':id')
  @ApiOperation({ summary: 'Update a business' })
  @ApiParam({ name: 'id', description: 'Business UUID' })
  @ApiResponse({ status: 200, description: 'Business updated successfully' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.businessService.update(id, updateBusinessDto, req.user.id);
  }

  // Delete Business
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a business' })
  @ApiParam({ name: 'id', description: 'Business UUID' })
  @ApiResponse({ status: 200, description: 'Business deleted successfully' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.businessService.remove(id, req.user.id);
  }
}
