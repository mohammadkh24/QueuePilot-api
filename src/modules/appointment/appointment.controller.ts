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

import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('businesses/:businessId/appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // Create Appointment
  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid appointment data' })
  @ApiResponse({ status: 404, description: 'Business or service not found' })
  @ApiResponse({ status: 409, description: 'Appointment time conflict' })
  create(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.create(
      businessId,
      req.user.id,
      createAppointmentDto,
    );
  }

  // Get All Appointments
  @Get()
  @ApiOperation({ summary: 'Get all appointments of a business' })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Appointments retrieved successfully',
  })
  findAll(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Req() req: AuthenticatedRequest,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.appointmentService.findAll(
      businessId,
      req.user.id,
      Number(page),
      Number(limit),
    );
  }

  // Get Appointment By ID
  @Get(':id')
  @ApiOperation({ summary: 'Get an appointment by ID' })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Appointment retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findOne(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) appointmentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.findOne(
      businessId,
      appointmentId,
      req.user.id,
    );
  }

  // Update Appointment
  @Patch(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 409, description: 'Appointment time conflict' })
  update(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) appointmentId: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.update(
      businessId,
      appointmentId,
      req.user.id,
      updateAppointmentDto,
    );
  }

  // Delete Appointment
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Appointment cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  remove(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) appointmentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.remove(
      businessId,
      appointmentId,
      req.user.id,
    );
  }
}
