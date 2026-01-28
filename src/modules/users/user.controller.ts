import { Controller, Get, UseGuards, Version } from '@nestjs/common';
import { UsersService } from './user.service';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { LoginUser } from 'src/common/decorator/login-user.decorator';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-user.type';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/users')
export class UserController {
  constructor(private usersService: UsersService) {}

  @Version('1')
  @Get('profile-details')
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('application/json')
  async details(@LoginUser() user: AuthenticatedUser) {
    return this.usersService.details(user.id);
  }
}
