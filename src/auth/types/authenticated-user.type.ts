import { User } from '@/modules/users/user.entity';

export type AuthenticatedUser = Omit<User, 'password'>;
