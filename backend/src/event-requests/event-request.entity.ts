import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Event } from '../events/event.entity';
import { Department } from '../departments/department.entity';
import { EventRequestStatus } from '../config/constants';

@Entity('event_requests')
export class EventRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  eventId: number;

  @OneToOne(() => Event, (event) => event.request, { nullable: true })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column({
    type: 'enum',
    enum: EventRequestStatus,
    default: EventRequestStatus.DRAFT,
  })
  status: EventRequestStatus;

  @Column('text', { nullable: true })
  comments: string; // комментарии администратора

  @Column()
  organizerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'organizerId' })
  organizer: User;

  // Данные мероприятия (дублируются для истории)
  @Column()
  title: string;

  @Column('date')
  dateStart: Date;

  @Column('date')
  dateEnd: Date;

  @Column('time')
  timeStart: string;

  @Column('time')
  timeEnd: string;

  @Column()
  place: string;

  @Column()
  format: string;

  @Column({ nullable: true })
  departmentId: number;

  @Column('simple-array', { nullable: true })
  departmentIds: number[];

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column('simple-array', { nullable: true })
  labels: string[];

  @Column({ nullable: true })
  limitParticipants: number;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  postLink: string;

  @Column({ nullable: true })
  regLink: string;

  @Column()
  responsibleLink: string;

  @Column('json', { nullable: true })
  repeat: any;

  @Column({ default: false })
  hasConflict: boolean; // есть ли конфликт по времени с другими мероприятиями

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
