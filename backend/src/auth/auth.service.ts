import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../config/constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, nickname } = registerDto;

    // Проверка существования пользователя
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(password, 10);

    // Получение роли по умолчанию (активист)
    const defaultRole = await this.rolesRepository.findOne({
      where: { name: UserRole.ACTIVIST },
    });

    if (!defaultRole) {
      throw new InternalServerErrorException('Default role not found. Make sure the database is initialized.');
    }

    // Создание пользователя
    const user = this.usersRepository.create({
      email,
      passwordHash,
      nickname,
      roleId: defaultRole.id,
      isVerified: false, // В будущем можно добавить подтверждение email
    });

    const savedUser = await this.usersRepository.save(user);

    // Генерация JWT токена
    const payload = { sub: savedUser.id, email: savedUser.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        nickname: savedUser.nickname,
        role: defaultRole.name,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Генерация JWT токена
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role?.name || UserRole.ACTIVIST,
      },
    };
  }

  async validateUser(userId: number): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    return user || null;
  }
}
