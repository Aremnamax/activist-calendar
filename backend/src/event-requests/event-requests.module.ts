import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventRequestsService } from './event-requests.service';
import { EventRequestsController } from './event-requests.controller';
import { EventRequest } from './event-request.entity';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([EventRequest]), EventsModule],
  controllers: [EventRequestsController],
  providers: [EventRequestsService],
  exports: [EventRequestsService],
})
export class EventRequestsModule {}
