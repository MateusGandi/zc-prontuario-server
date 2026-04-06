import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsAdmin, CurrentUser } from '../auth/auth.guard';
import type { TokenPayload } from '../auth/auth.guard';
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';

@ApiTags('users')
@IsAdmin()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Lista usuários do tenant (admin)' })
  @Get()
  findAll(@CurrentUser() user: TokenPayload) {
    return this.userService.findAll(user.tenantId);
  }

  @ApiOperation({ summary: 'Cria usuário no tenant (admin)' })
  @Post()
  create(@CurrentUser() user: TokenPayload, @Body() dto: CreateUserDto) {
    return this.userService.create(user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Remove usuário do tenant (admin)' })
  @Delete(':id')
  remove(
    @CurrentUser() user: TokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.userService.remove(user.tenantId, id);
  }
}
