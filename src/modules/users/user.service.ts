import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { ApiResponse } from '@/common/types/api-response.type';

@Injectable()
export class UsersService {
  constructor(private userRepo: UserRepository) {}

  async details(id: string): Promise<ApiResponse> {
    const user = await this.userRepo.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'User details',
      data: user,
    };
  }
}
