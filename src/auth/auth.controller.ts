import { Controller, Post, Body, Version, HttpCode } from '@nestjs/common';
import { UsersService } from '@/modules/users/user.service';
import { AuthService } from '@/auth/auth.service';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { LoginDto, RegisterDto } from '@/auth/dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private userService: UsersService,
    private authService: AuthService,
  ) { }

  @Version("1")
  @Post('register')
  @ApiConsumes('application/json')
  async register(
    @Body() body: RegisterDto,
  ) {
    return await this.userService.register(body);
  }

  @Version("1")
  @Post('login')
  @HttpCode(200)
  @ApiConsumes('application/json')
  async login(@Body() body: LoginDto) {
    return await this.authService.login(body);
  }
}
