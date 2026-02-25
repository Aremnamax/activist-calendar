import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Event } from './event.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { EventChangeLog } from '../event-change-logs/event-change-log.entity';
import { EventStatus } from '../config/constants';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(EventChangeLog)
    private changeLogsRepository: Repository<EventChangeLog>,
  ) {}

  async create(data: Partial<Event>): Promise<Event> {
    const event = this.eventsRepository.create({
      ...data,
      status: EventStatus.PLANNED,
    });
    return this.eventsRepository.save(event);
  }

  async updateFromRequest(
    eventId: number,
    data: {
      title: string;
      dateStart: any;
      dateEnd: any;
      timeStart: string;
      timeEnd: string;
      place: string;
      format: string;
      departmentId?: number | null;
      labels?: string[];
      limitParticipants?: number | null;
      description: string;
      postLink?: string | null;
      regLink?: string | null;
      responsibleLink: string;
      repeat?: any;
    },
  ): Promise<Event> {
    await this.eventsRepository.update(eventId, {
      title: data.title,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      timeStart: data.timeStart,
      timeEnd: data.timeEnd,
      place: data.place,
      format: data.format as any,
      departmentId: data.departmentId ?? null,
      labels: data.labels || [],
      limitParticipants: data.limitParticipants ?? null,
      description: data.description,
      postLink: data.postLink ?? null,
      regLink: data.regLink ?? null,
      responsibleLink: data.responsibleLink,
      repeat: data.repeat ?? null,
    });
    return this.eventsRepository.findOne({ where: { id: eventId } });
  }

  async findAll(startDate?: Date, endDate?: Date): Promise<any[]> {
    const query = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.department', 'department')
      .where('event.status != :status', { status: EventStatus.CANCELED });

    if (startDate && endDate) {
      query.andWhere(
        '(event.dateStart <= :endDate AND event.dateEnd >= :startDate)',
        { startDate, endDate },
      );
    }

    const events = await query.getMany();

    return events.map((e) => ({
      ...e,
      dateStart: this.toDateString(e.dateStart),
      dateEnd: this.toDateString(e.dateEnd),
    }));
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

  async findOne(id: number): Promise<any | null> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['department', 'subscriptions'],
    });
    if (!event) return null;
    return {
      ...event,
      dateStart: this.toDateString(event.dateStart),
      dateEnd: this.toDateString(event.dateEnd),
    };
  }

  async checkTimeConflict(
    dateStart: Date,
    dateEnd: Date,
    timeStart: string,
    timeEnd: string,
    excludeEventId?: number,
  ): Promise<boolean> {
    const conflicts = await this.getConflictingEvents(
      dateStart,
      dateEnd,
      timeStart,
      timeEnd,
      excludeEventId,
    );
    return conflicts.length > 0;
  }

  async getConflictingEvents(
    dateStart: Date,
    dateEnd: Date,
    timeStart: string,
    timeEnd: string,
    excludeEventId?: number,
  ): Promise<Event[]> {
    const events = await this.eventsRepository.find({
      where: [
        {
          dateStart: Between(dateStart, dateEnd),
          status: EventStatus.PLANNED,
        },
        {
          dateEnd: Between(dateStart, dateEnd),
          status: EventStatus.PLANNED,
        },
      ],
      relations: ['department'],
    });

    const overlapping = events.filter((event) => {
      if (excludeEventId && event.id === excludeEventId) return false;
      return this.timesOverlap(
        timeStart,
        timeEnd,
        event.timeStart,
        event.timeEnd,
      );
    });

    return overlapping;
  }

  async clearRequestLink(eventId: number): Promise<void> {
    await this.eventsRepository.update({ id: eventId }, { requestId: null } as any);
  }

  async remove(eventId: number): Promise<void> {
    await this.subscriptionsRepository.delete({ eventId });
    await this.changeLogsRepository.delete({ eventId });
    await this.eventsRepository.delete(eventId);
  }

  private timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const [h1, m1] = start1.split(':').map(Number);
    const [h2, m2] = end1.split(':').map(Number);
    const [h3, m3] = start2.split(':').map(Number);
    const [h4, m4] = end2.split(':').map(Number);

    const time1Start = h1 * 60 + m1;
    const time1End = h2 * 60 + m2;
    const time2Start = h3 * 60 + m3;
    const time2End = h4 * 60 + m4;

    return time1Start < time2End && time2Start < time1End;
  }
}
