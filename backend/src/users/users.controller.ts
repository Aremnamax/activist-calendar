import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { RolesService } from '../roles/roles.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, UserRole } from '../config/constants';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role?.name,
      subscribedDepartments: user.subscribedDepartments || [],
    };
  }

  @Patch('me')
  async updateProfile(
    @Request() req,
    @Body() body: { nickname?: string; email?: string; password?: string },
  ) {
    const user = await this.usersService.updateProfile(req.user.id, body);
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role?.name,
    };
  }

  @Post('request-organizer')
  async requestOrganizer(@Request() req) {
    await this.notificationsService.createForAdmins(
      `Пользователь ${req.user.nickname} (${req.user.email}) запрашивает роль Организатора`,
      NotificationType.APPROVAL,
      { action: 'organizer_request', userId: req.user.id, nickname: req.user.nickname, email: req.user.email },
    );
    return { success: true, message: 'Заявка отправлена администраторам' };
  }

  @Post(':id/approve-organizer')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveOrganizer(@Param('id') id: string, @Request() req) {
    const role = await this.rolesService.findOne(UserRole.ORGANIZER);
    if (!role) throw new ForbiddenException('Role not found');
    const user = await this.usersService.updateRole(+id, role.id);
    await this.notificationsService.create(
      +id,
      NotificationType.APPROVAL,
      'Ваша заявка на роль Организатора одобрена!',
    );
    return { success: true, nickname: user.nickname };
  }

  @Post(':id/reject-organizer')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async rejectOrganizer(@Param('id') id: string, @Request() req) {
    await this.notificationsService.create(
      +id,
      NotificationType.REJECTION,
      'Ваша заявка на роль Организатора отклонена.',
    );
    return { success: true };
  }

  @Patch('me/departments')
  async updateSubscribedDepartments(
    @Request() req,
    @Body() body: { departmentIds: number[] },
  ) {
    const user = await this.usersService.findOne(req.user.id);
    user.subscribedDepartments = body.departmentIds;
    await this.usersService.updateProfile(req.user.id, {} as any);
    const { subscribedDepartments, ...rest } = user;
    await this.usersService['usersRepository'].update(req.user.id, {
      subscribedDepartments: body.departmentIds,
    });
    return { success: true, departmentIds: body.departmentIds };
  }
}
