import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from '../departments/department.entity';
import { EventRequest } from '../event-requests/event-request.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { EventChangeLog } from '../event-change-logs/event-change-log.entity';
import { EventStatus, EventFormat, RepeatInterval } from '../config/constants';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('date')
  dateStart: Date;

  @Column('date')
  dateEnd: Date;

  @Column('time')
  timeStart: string; // HH:MM

  @Column('time')
  timeEnd: string; // HH:MM

  @Column()
  place: string;

  @Column({
    type: 'enum',
    enum: EventFormat,
  })
  format: EventFormat;

  @Column({ nullable: true })
  departmentId: number;

  @Column('simple-array', {
    nullable: true,
    transformer: {
      from: (v: unknown): number[] => {
        if (v == null) return [];
        if (Array.isArray(v)) return v.map((x) => Number(x)).filter((n) => !isNaN(n));
        if (typeof v === 'string') return v ? v.split(',').map(Number).filter((n) => !isNaN(n)) : [];
        return [];
      },
      to: (v: number[] | string[] | null | undefined) => {
        if (!v || !Array.isArray(v) || v.length === 0) return null;
        return v.map((x) => String(x)).join(',');
      },
    },
  })
  departmentIds: number[];

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column('simple-array', { nullable: true })
  labels: string[]; // метки: развлекательное, образовательное и т.д.

  @Column({ nullable: true })
  limitParticipants: number; // null = без ограничений

  @Column('text')
  description: string;

  @Column({ nullable: true })
  postLink: string;

  @Column({ nullable: true })
  regLink: string;

  @Column({ nullable: true })
  responsibleLink: string;

  @Column('json', { nullable: true })
  repeat: {
    interval: RepeatInterval;
    customDays?: number[];
    endDate?: Date;
  } | null;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PLANNED,
  })
  status: EventStatus;

  @Column({ nullable: true })
  requestId: number;

  @OneToOne(() => EventRequest, { nullable: true })
  @JoinColumn({ name: 'requestId' })
  request: EventRequest;

  @OneToMany(() => Subscription, (subscription) => subscription.event)
  subscriptions: Subscription[];

  @OneToMany(() => EventChangeLog, (log) => log.event)
  changeLogs: EventChangeLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
