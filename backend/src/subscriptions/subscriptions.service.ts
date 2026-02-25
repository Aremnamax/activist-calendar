import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  async subscribe(userId: number, eventId: number): Promise<Subscription> {
    const existing = await this.subscriptionsRepository.findOne({
      where: { userId, eventId },
    });
    if (existing) {
      return existing;
    }

    const subscription = this.subscriptionsRepository.create({
      userId,
      eventId,
    });
    return this.subscriptionsRepository.save(subscription);
  }

  async unsubscribe(userId: number, eventId: number): Promise<void> {
    await this.subscriptionsRepository.delete({ userId, eventId });
  }

  async findByUser(userId: number): Promise<Subscription[]> {
    return this.subscriptionsRepository.find({
      where: { userId },
      relations: ['event', 'event.department'],
    });
  }
}
