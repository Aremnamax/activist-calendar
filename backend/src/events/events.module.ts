import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './event.entity';
import { Department } from '../departments/department.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { EventChangeLog } from '../event-change-logs/event-change-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Department, Subscription, EventChangeLog])],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
