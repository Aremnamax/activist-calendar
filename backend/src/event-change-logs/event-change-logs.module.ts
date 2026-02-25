import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventChangeLog } from './event-change-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventChangeLog])],
  exports: [TypeOrmModule],
})
export class EventChangeLogsModule {}
