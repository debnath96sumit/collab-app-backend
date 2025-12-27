import { Controller, Get, UseGuards, Version } from '@nestjs/common';
import { UsersService } from './user.service';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LoginUser } from 'src/common/decorator/login-user.decorator';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-user.type';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private usersService: UsersService) {}

  @Version('1')
  @Get('profile-details')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('application/json')
  async details(@LoginUser() user: AuthenticatedUser) {
    return this.usersService.details(user.id);
  }
}
