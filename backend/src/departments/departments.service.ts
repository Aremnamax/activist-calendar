import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './department.entity';
import { DEPARTMENT_COLORS } from '../config/constants';

@Injectable()
export class DepartmentsService implements OnModuleInit {
  constructor(
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
  ) {}

  async onModuleInit() {
    // Инициализация подразделений при старте приложения
    await this.initializeDepartments();
  }

  private async initializeDepartments() {
    for (const [name, color] of Object.entries(DEPARTMENT_COLORS)) {
      const existing = await this.departmentsRepository.findOne({
        where: { name },
      });
      if (!existing) {
        const department = this.departmentsRepository.create({ name, color });
        await this.departmentsRepository.save(department);
      }
    }
  }

  async findAll(): Promise<Department[]> {
    return this.departmentsRepository.find();
  }

  async findOne(id: number): Promise<Department | null> {
    return this.departmentsRepository.findOne({ where: { id } });
  }
}
