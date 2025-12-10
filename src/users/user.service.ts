import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import { ApiResponse } from '@/common/types/api-response.type';
import { RegisterDto } from '@/auth/dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(private userRepo: UserRepository) { }

  async register(
    dto: RegisterDto,
  ): Promise<ApiResponse> {
    const checkUserExits = await this.userRepo.findByCondition({ email: dto.email });
    if (checkUserExits) {
      throw new ConflictException('User already exists');
    }
    const checkUsernameExits = await this.userRepo.findByCondition({ username: dto.username });
    if (checkUsernameExits) {
      throw new ConflictException('Username already exists');
    }
    const user = await this.userRepo.create({ email: dto.email, username: dto.username, password: dto.password });
    return {
      statusCode: 201,
      message: 'User created successfully',
      data: user,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findByCondition({ email });
    if (user && (await user.comparePassword(password))) {
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
