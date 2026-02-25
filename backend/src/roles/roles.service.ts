import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { UserRole } from '../config/constants';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    // Инициализация ролей при старте приложения
    await this.initializeRoles();
  }

  private async initializeRoles() {
    const roles = [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.ACTIVIST];
    for (const roleName of roles) {
      const existing = await this.rolesRepository.findOne({
        where: { name: roleName },
      });
      if (!existing) {
        const role = this.rolesRepository.create({ name: roleName });
        await this.rolesRepository.save(role);
      }
    }
  }

  async findOne(name: string): Promise<Role | null> {
    return this.rolesRepository.findOne({ where: { name } });
  }
}
