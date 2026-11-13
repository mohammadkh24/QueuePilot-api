import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PublicBusinessService } from './public-business.service';

@ApiTags('Public')
@Controller('public/businesses')
export class PublicBusinessController {
  constructor(private readonly publicBusinessService: PublicBusinessService) {}

  @Get()
  @ApiOperation({ summary: 'Browse active businesses' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('search') search = '', @Query('page') page = '1', @Query('limit') limit = '12') {
    return this.publicBusinessService.findBusinesses(search, Number(page), Number(limit));
  }

  @Get(':businessId')
  @ApiOperation({ summary: 'Get a public business profile' })
  findOne(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.publicBusinessService.findBusiness(businessId);
  }

  @Get(':businessId/services')
  @ApiOperation({ summary: 'List active services of a public business' })
  findServices(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.publicBusinessService.findServices(businessId);
  }
}
