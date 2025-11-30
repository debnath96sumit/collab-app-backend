import { User } from "src/users/user.entity";

export interface AuthenticatedUser extends Pick<User, 'id' | 'username'> { }