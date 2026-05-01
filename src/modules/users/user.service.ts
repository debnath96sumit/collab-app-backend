import { BadRequestException, ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { ApiResponse } from '@/common/types/api-response.type';
import { ChangePasswordDTO, UpdateProfileDto } from './user.dto';
import { AuthenticatedUser } from '@/auth/types/authenticated-user.type';
import * as bcrypt from 'bcrypt';
import { existsSync, unlinkSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';

@Injectable()
export class UsersService {
  constructor(
    private userRepo: UserRepository,
    private configService: ConfigService
  ) { }

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

  async userChangePassword(
    body: ChangePasswordDTO,
    user: AuthenticatedUser,
  ): Promise<ApiResponse> {
    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Profile details not found.',
      };
    }

    let userData = await this.userRepo.findOneById(user.id);
    if (!userData) throw new NotFoundException('User not found!');

    const isMatch = await bcrypt.compare(body.oldPassword, userData.password);

    if (!isMatch) {
      throw new BadRequestException('Sorry old password mismatch!');
    }
    const hashedPass = await bcrypt.hash(body.newPassword, 10);
    let userUpdate = await this.userRepo.updateById(
      user.id, {
      password: hashedPass
    }
    );

    return {
      statusCode: userUpdate ? HttpStatus.OK : HttpStatus.BAD_REQUEST,
      message: userUpdate
        ? 'Your password has been updated successfully.'
        : 'Unable to change password at this moment.',
      data: {},
    };
  }

  async updateProfile(
    dto: UpdateProfileDto,
    file: Express.Multer.File | undefined,
    userId: string,
  ): Promise<ApiResponse> {
    const user = await this.userRepo.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepo.findByCondition({ email: dto.email });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    if (dto.username && dto.username !== user.username) {
      const existing = await this.userRepo.findByCondition({ username: dto.username });
      if (existing && existing.id !== userId) {
        throw new ConflictException('User Name already in use');
      }
    }

    const updateData: Partial<typeof user> = {};

    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.email) updateData.email = dto.email;

    if (file) {
      if (user.avatarUrl) {
        const filename = user.avatarUrl.split('/uploads/avatars/')[1];

        if (filename) {
          const oldPath = join(process.cwd(), 'public', 'uploads', 'avatars', filename);
          if (existsSync(oldPath)) unlinkSync(oldPath);
        }
      }
      updateData.avatarUrl = `${this.configService.getOrThrow('BACKEND_URL')}/uploads/avatars/${file.filename}`;
    }

    const updated = await this.userRepo.updateById(userId, updateData);
    // const { password, ...rest } = updated;

    return {
      statusCode: HttpStatus.OK,
      message: 'Profile updated successfully',
      data: updated,
    };
  }
}
