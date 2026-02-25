import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { EventChangeLogsModule } from './event-change-logs/event-change-logs.module';
import { EventsModule } from './events/events.module';
import { EventRequestsModule } from './event-requests/event-requests.module';
import { DepartmentsModule } from './departments/departments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebsocketModule } from './websocket/websocket.module';
import { typeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    RolesModule,
    AuthModule,
    UsersModule,
    EventsModule,
    EventRequestsModule,
    DepartmentsModule,
    SubscriptionsModule,
    NotificationsModule,
    WebsocketModule,
    EventChangeLogsModule,
  ],
})
export class AppModule {}
