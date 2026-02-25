import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationType } from '../config/constants';
import { User } from '../users/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    userId: number,
    type: NotificationType,
    message: string,
    metadata?: Record<string, any> | null,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      userId,
      type,
      message,
      metadata: metadata || null,
      sentAt: new Date(),
    });
    return this.notificationsRepository.save(notification);
  }

  async createForAdmins(
    message: string,
    type: NotificationType,
    metadata?: Record<string, any> | null,
  ): Promise<void> {
    const admins = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name = :name', { name: 'admin' })
      .getMany();

    for (const admin of admins) {
      await this.create(admin.id, type, message, metadata);
    }
  }

  async findByUser(userId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async unreadCount(userId: number): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: number): Promise<void> {
    await this.notificationsRepository.update(id, { isRead: true });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }
}
