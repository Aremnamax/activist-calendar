import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Subscription } from './subscription.entity';
import { Department } from '../departments/department.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
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

  async findByUser(userId: number): Promise<any[]> {
    const subs = await this.subscriptionsRepository.find({
      where: { userId },
      relations: ['event', 'event.department'],
    });
    const allDeptIds = [...new Set(subs.flatMap((s) => s.event?.departmentIds || (s.event?.departmentId ? [s.event.departmentId] : [])))];
    const departmentsMap = new Map<number, Department>();
    if (allDeptIds.length > 0) {
      const depts = await this.departmentsRepository.find({ where: { id: In(allDeptIds) } });
      depts.forEach((d) => departmentsMap.set(d.id, d));
    }
    return subs.map((s) => {
      const ids = s.event?.departmentIds?.length ? s.event.departmentIds : (s.event?.departmentId ? [s.event.departmentId] : []);
      const departments = ids.map((id) => departmentsMap.get(id)).filter(Boolean);
      return { ...s, event: { ...s.event, departments } };
    });
  }
}
