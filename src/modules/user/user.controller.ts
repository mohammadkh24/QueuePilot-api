import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user account with the provided information.',
  })
  @ApiCreatedResponse({
    description: 'User successfully created.',
  })
  @ApiConflictResponse({
    description: 'A user with this email already exists.',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves a paginated list of users with optional search.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search users by first name, last name, or email.',
    example: 'Mohammad',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number.',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of users per page.',
    example: 10,
  })
  @ApiOkResponse({
    description: 'Users successfully retrieved.',
  })
  findAll(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.usersService.findAll(search, Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a user by ID',
    description: 'Retrieves a single user by their unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'User successfully retrieved.',
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a user',
    description: 'Updates the information of an existing user.',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID.',
  })
  @ApiOkResponse({
    description: 'User successfully updated.',
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  @ApiConflictResponse({
    description: 'The provided email is already in use.',
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a user',
    description: 'Permanently deletes a user by their unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID.',
  })
  @ApiOkResponse({
    description: 'User successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
