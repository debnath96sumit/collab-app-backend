import { Body, Controller, Get, Patch, Post, UploadedFile, UseGuards, UseInterceptors, Version } from '@nestjs/common';
import { UsersService } from './user.service';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { LoginUser } from 'src/common/decorator/login-user.decorator';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-user.type';
import { AuthGuard } from '@nestjs/passport';
import { ChangePasswordDTO, UpdateProfileDto } from './user.dto';
import { SingleFileInterceptor } from '@/common/interceptors/files.interceptor';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private userService: UsersService) {}

  @Version('1')
  @Get('profile-details')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('application/json')
  async details(@LoginUser() user: AuthenticatedUser) {
    return this.userService.details(user.id);
  }

  @Version('1')
  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiConsumes('application/json')
  async userChangePassword(
    @Body() dto: ChangePasswordDTO,
    @LoginUser() user: AuthenticatedUser,
  ) {
    return await this.userService.userChangePassword(dto, user);
  }

  
  @Version('1')
  @Patch('update-profile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(SingleFileInterceptor('avatars', 'avatar')  )
  async updateProfile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateProfileDto,
    @LoginUser() user: AuthenticatedUser,
  ) {
    return this.userService.updateProfile(dto, file, user.id);
  }
}
