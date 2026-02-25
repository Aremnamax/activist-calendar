import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventRequest } from './event-request.entity';
import { EventRequestStatus } from '../config/constants';
import { EventsService } from '../events/events.service';

@Injectable()
export class EventRequestsService {
  constructor(
    @InjectRepository(EventRequest)
    private eventRequestsRepository: Repository<EventRequest>,
    private eventsService: EventsService,
  ) {}

  async create(
    data: Partial<EventRequest>,
    autoApprove = false,
  ): Promise<any> {
    const start = data.dateStart ? new Date(String(data.dateStart) + 'T00:00:00') : new Date();
    const end = data.dateEnd ? new Date(String(data.dateEnd) + 'T23:59:59') : new Date();
    const conflictingEvents = await this.eventsService.getConflictingEvents(
      start,
      end,
      data.timeStart || '00:00',
      data.timeEnd || '23:59',
    );
    const hasConflict = conflictingEvents.length > 0;

    const deptId = Array.isArray(data.departmentIds) && data.departmentIds.length > 0
      ? data.departmentIds[0]
      : data.departmentId;

    const request = this.eventRequestsRepository.create({
      ...data,
      departmentId: deptId,
      departmentIds: data.departmentIds || (data.departmentId ? [data.departmentId] : null),
      hasConflict,
      status: autoApprove
        ? EventRequestStatus.APPROVED
        : EventRequestStatus.DRAFT,
    });

    const saved = await this.eventRequestsRepository.save(request);

    if (autoApprove) {
      const event = await this.eventsService.create({
        title: saved.title,
        dateStart: saved.dateStart,
        dateEnd: saved.dateEnd,
        timeStart: saved.timeStart,
        timeEnd: saved.timeEnd,
        place: saved.place,
        format: saved.format as any,
        departmentId: saved.departmentId ?? deptId,
        labels: saved.labels || [],
        limitParticipants: saved.limitParticipants,
        description: saved.description,
        postLink: saved.postLink,
        regLink: saved.regLink,
        responsibleLink: saved.responsibleLink,
        repeat: saved.repeat,
        requestId: saved.id,
      });
      await this.eventRequestsRepository.update(saved.id, {
        eventId: event.id,
      });
    }

    return { ...this.normalizeRequest(saved), id: saved.id, conflictingEvents };
  }

  async getConflictingEvents(
    dateStart: string,
    dateEnd: string,
    timeStart: string,
    timeEnd: string,
    excludeRequestId?: number,
  ): Promise<any[]> {
    const start = dateStart ? new Date(dateStart + 'T00:00:00') : new Date();
    const end = dateEnd ? new Date(dateEnd + 'T23:59:59') : new Date();
    let excludeEventId: number | undefined;
    if (excludeRequestId) {
      const req = await this.eventRequestsRepository.findOne({
        where: { id: excludeRequestId },
        select: ['eventId'],
      });
      if (req?.eventId) excludeEventId = req.eventId;
    }
    const events = await this.eventsService.getConflictingEvents(
      start,
      end,
      timeStart || '00:00',
      timeEnd || '23:59',
      excludeEventId,
    );
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      dateStart: this.toDateString(e.dateStart),
      timeStart: e.timeStart,
      timeEnd: e.timeEnd,
      place: e.place,
      department: e.department,
    }));
  }

  async submit(id: number, organizerId: number): Promise<any> {
    const req = await this.eventRequestsRepository.findOne({
      where: { id },
      select: ['id', 'organizerId', 'status'],
    });
    if (!req || req.organizerId !== organizerId) return null;
    if (
      req.status !== EventRequestStatus.DRAFT &&
      req.status !== EventRequestStatus.NEEDS_WORK
    )
      return this.findOne(id);
    await this.eventRequestsRepository.update(id, { status: EventRequestStatus.PENDING });
    return { id, status: EventRequestStatus.PENDING };
  }

  private toDateString(d: any): string {
    if (!d) return '';
    if (d instanceof Date) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return String(d).slice(0, 10);
  }

  private normalizeRequest(r: EventRequest): any {
    return {
      ...r,
      dateStart: this.toDateString(r.dateStart),
      dateEnd: this.toDateString(r.dateEnd),
    };
  }

  async findAll(organizerId?: number): Promise<any[]> {
    const query = this.eventRequestsRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.organizer', 'organizer')
      .leftJoinAndSelect('request.event', 'event')
      .leftJoinAndSelect('request.department', 'department')
      .orderBy('request.createdAt', 'DESC');

    if (organizerId) {
      query.where('request.organizerId = :organizerId', { organizerId });
    }

    const items = await query.getMany();
    return items.map((r) => this.normalizeRequest(r));
  }

  async findOneForPermission(id: number): Promise<{ organizerId: number; eventId?: number } | null> {
    const r = await this.eventRequestsRepository.findOne({
      where: { id },
      select: ['id', 'organizerId', 'eventId'],
    });
    return r ? { organizerId: r.organizerId, eventId: r.eventId } : null;
  }

  async findOne(id: number): Promise<any | null> {
    const r = await this.eventRequestsRepository.findOne({
      where: { id },
      relations: ['organizer', 'event', 'department'],
    });
    if (!r) return null;
    const result = this.normalizeRequest(r);
    if (r.hasConflict && r.dateStart && r.timeStart && r.timeEnd) {
      result.conflictingEvents = await this.getConflictingEvents(
        this.toDateString(r.dateStart),
        this.toDateString(r.dateEnd || r.dateStart),
        r.timeStart,
        r.timeEnd,
        id,
      );
    }
    return result;
  }

  async update(
    id: number,
    data: Partial<EventRequest>,
  ): Promise<EventRequest> {
    const existing = await this.eventRequestsRepository.findOne({
      where: { id },
    });
    const updateData = { ...data } as any;
    if (Array.isArray(data.departmentIds)) {
      updateData.departmentId = data.departmentIds.length > 0 ? data.departmentIds[0] : null;
    }
    await this.eventRequestsRepository.update(id, updateData);

    if (
      existing?.status === EventRequestStatus.APPROVED &&
      data.status === EventRequestStatus.PENDING &&
      existing.eventId
    ) {
      const updatedRequest = await this.findOne(id);
      await this.eventsService.updateFromRequest(existing.eventId, {
        title: updatedRequest.title,
        dateStart: updatedRequest.dateStart,
        dateEnd: updatedRequest.dateEnd,
        timeStart: updatedRequest.timeStart,
        timeEnd: updatedRequest.timeEnd,
        place: updatedRequest.place,
        format: updatedRequest.format,
        departmentId: updatedRequest.departmentId,
        labels: updatedRequest.labels || [],
        limitParticipants: updatedRequest.limitParticipants,
        description: updatedRequest.description,
        postLink: updatedRequest.postLink,
        regLink: updatedRequest.regLink,
        responsibleLink: updatedRequest.responsibleLink,
        repeat: updatedRequest.repeat,
      });
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const req = await this.eventRequestsRepository.findOne({ where: { id } });
    const eventId = req?.eventId;
    if (eventId) {
      await this.eventsService.clearRequestLink(eventId);
    }
    await this.eventRequestsRepository.delete(id);
    if (eventId) {
      await this.eventsService.remove(eventId);
    }
    return { success: true };
  }

  async pendingCount(): Promise<{ count: number }> {
    const count = await this.eventRequestsRepository.count({
      where: { status: EventRequestStatus.PENDING },
    });
    return { count };
  }

  async moderate(
    id: number,
    status: EventRequestStatus,
    comments?: string,
  ): Promise<{ id: number; status: EventRequestStatus }> {
    const request = await this.eventRequestsRepository.findOne({
      where: { id },
      select: [
        'id', 'eventId', 'title', 'dateStart', 'dateEnd', 'timeStart', 'timeEnd',
        'place', 'format', 'departmentId', 'departmentIds', 'labels', 'limitParticipants',
        'description', 'postLink', 'regLink', 'responsibleLink', 'repeat',
      ],
    });
    if (!request) throw new NotFoundException('Заявка не найдена');

    if (status === EventRequestStatus.REJECTED && (!comments || !comments.trim())) {
      throw new BadRequestException('При отклонении необходимо указать причину');
    }

    const updateData: Partial<EventRequest> = { status };
    if (comments !== undefined && comments !== null) {
      updateData.comments = comments;
    }
    await this.eventRequestsRepository.update(id, updateData);

    if (status === EventRequestStatus.APPROVED) {
      const deptId = (request.departmentIds?.length ? request.departmentIds[0] : null) ?? request.departmentId;
      if (request.eventId) {
        await this.eventsService.updateFromRequest(request.eventId, {
          title: request.title,
          dateStart: request.dateStart,
          dateEnd: request.dateEnd,
          timeStart: request.timeStart,
          timeEnd: request.timeEnd,
          place: request.place,
          format: request.format,
          departmentId: deptId,
          labels: request.labels || [],
          limitParticipants: request.limitParticipants,
          description: request.description,
          postLink: request.postLink,
          regLink: request.regLink,
          responsibleLink: request.responsibleLink,
          repeat: request.repeat,
        });
      } else {
        const event = await this.eventsService.create({
          title: request.title,
          dateStart: request.dateStart,
          dateEnd: request.dateEnd,
          timeStart: request.timeStart,
          timeEnd: request.timeEnd,
          place: request.place,
          format: request.format as any,
          departmentId: deptId ?? request.departmentId,
          labels: request.labels || [],
          limitParticipants: request.limitParticipants,
          description: request.description,
          postLink: request.postLink,
          regLink: request.regLink,
          responsibleLink: request.responsibleLink,
          repeat: request.repeat,
          requestId: id,
        });
        await this.eventRequestsRepository.update(id, { eventId: event.id });
      }
    }

    return { id, status };
  }
}
