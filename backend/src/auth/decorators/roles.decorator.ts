import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../config/constants';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
