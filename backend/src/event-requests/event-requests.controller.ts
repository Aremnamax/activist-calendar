import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EventRequestsService } from './event-requests.service';
import { EventRequestStatus, UserRole } from '../config/constants';

@Controller('event-requests')
@UseGuards(JwtAuthGuard)
export class EventRequestsController {
  constructor(
    private readonly eventRequestsService: EventRequestsService,
  ) {}

  @Post()
  async create(@Body() data: any, @Request() req) {
    const isAdmin = req.user.role?.name === UserRole.ADMIN;
    return this.eventRequestsService.create(
      { ...data, organizerId: req.user.id },
      isAdmin,
    );
  }

  @Get()
  async findAll(@Request() req, @Query('mine') mine?: string) {
    const forceOwn = mine === 'true';
    const organizerId =
      forceOwn || req.user.role?.name !== UserRole.ADMIN
        ? req.user.id
        : undefined;
    return this.eventRequestsService.findAll(organizerId);
  }

  @Get('pending-count')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async pendingCount() {
    return this.eventRequestsService.pendingCount();
  }

  @Get('check-conflict')
  async checkConflict(
    @Query('dateStart') dateStart: string,
    @Query('dateEnd') dateEnd: string,
    @Query('timeStart') timeStart: string,
    @Query('timeEnd') timeEnd: string,
    @Query('requestId') requestId?: string,
  ) {
    return this.eventRequestsService.getConflictingEvents(
      dateStart || '',
      dateEnd || dateStart || '',
      timeStart || '00:00',
      timeEnd || '23:59',
      requestId ? +requestId : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventRequestsService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req,
  ) {
    const existing = await this.eventRequestsService.findOne(+id);
    if (!existing) throw new NotFoundException();
    const isAdmin = req.user.role?.name === UserRole.ADMIN;
    if (!isAdmin && existing.organizerId !== req.user.id) {
      throw new ForbiddenException();
    }
    const wasApproved = existing.status === EventRequestStatus.APPROVED;
    const result = await this.eventRequestsService.update(+id, data);
    if (wasApproved && !isAdmin) {
      await this.eventRequestsService.update(+id, {
        status: EventRequestStatus.PENDING,
      } as any);
      return this.eventRequestsService.findOne(+id);
    }
    return result;
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Request() req) {
    return this.eventRequestsService.submit(+id, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const existing = await this.eventRequestsService.findOneForPermission(+id);
    if (!existing) throw new NotFoundException('Заявка не найдена');
    const isAdmin = req.user.role?.name === UserRole.ADMIN;
    if (!isAdmin && existing.organizerId !== req.user.id) {
      throw new ForbiddenException('Нельзя удалить чужую заявку');
    }
    if (!isAdmin && existing.eventId) {
      throw new ForbiddenException('Одобренные мероприятия нельзя удалить. Обратитесь к администратору.');
    }
    return this.eventRequestsService.remove(+id);
  }

  @Patch(':id/moderate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async moderate(
    @Param('id') id: string,
    @Body() body: { status: EventRequestStatus; comments?: string },
  ) {
    return this.eventRequestsService.moderate(
      +id,
      body.status,
      body.comments ?? null,
    );
  }
}
