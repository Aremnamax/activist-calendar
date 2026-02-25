import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async updateProfile(
    id: number,
    data: { nickname?: string; email?: string; password?: string },
  ): Promise<User> {
    const updateData: any = {};
    if (data.nickname) updateData.nickname = data.nickname;
    if (data.email) updateData.email = data.email;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }
    await this.usersRepository.update(id, updateData);
    return this.findOne(id);
  }

  async updateRole(id: number, roleId: number): Promise<User> {
    await this.usersRepository.update(id, { roleId });
    return this.findOne(id);
  }
}
