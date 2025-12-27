import { User } from '@/modules/users/user.entity';

export interface AuthenticatedUser extends Pick<User, 'id' | 'username'> {}
