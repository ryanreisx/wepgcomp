import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserLevel } from '@prisma/client';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    const data = await this.userService.findAll();
    return { data };
  }

  @Get('pending')
  async findPending() {
    const data = await this.userService.findPendingProfessors();
    return { data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.userService.findById(id);
    return { data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.userService.update(id, dto);
    return { data, message: 'User updated successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string) {
    const data = await this.userService.approveProfessor(id);
    return { data, message: 'Professor approved successfully' };
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: string) {
    const data = await this.userService.rejectProfessor(id);
    return { data, message: 'Professor rejected successfully' };
  }

  @Patch(':id/level')
  async updateLevel(
    @Param('id') id: string,
    @Body() dto: UpdateLevelDto,
    @CurrentUser() caller: { sub: string; level: UserLevel },
  ) {
    const data = await this.userService.updateLevel(
      id,
      dto.level,
      caller.level,
    );
    return { data, message: 'User level updated successfully' };
  }
}
