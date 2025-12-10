import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import { ApiResponse } from '@/common/types/api-response.type';

@Injectable()
export class UsersService {
  constructor(private userRepo: UserRepository) { }

  async create(
    email: string,
    username: string,
    password: string,
  ): Promise<ApiResponse> {
    const checkUserExits = await this.userRepo.findByCondition({ email });
    if (checkUserExits) {
      throw new ConflictException('User already exists');
    }
    const checkUsernameExits = await this.userRepo.findByCondition({ username });
    if (checkUsernameExits) {
      throw new ConflictException('Username already exists');
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userRepo.create({ email, username, password: hashed });
    return {
      statusCode: 201,
      message: 'User created successfully',
      data: user,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findByCondition({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }
  async details(id: number): Promise<ApiResponse> {
    const user = await this.userRepo.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      statusCode: 200,
      message: 'User details',
      data: user,
    };
  }
}
