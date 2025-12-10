import { Controller, Post, Body, Version } from '@nestjs/common';
import { UsersService } from '@/users/user.service';
import { AuthService } from '@/auth/auth.service';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { LoginDto, RegisterDto } from '@/auth/dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) { }

  @Version("1")
  @Post('register')
  @ApiConsumes('application/json')
  async register(
    @Body() body: RegisterDto,
  ) {
    return await this.usersService.create(
      body.email,
      body.username,
      body.password,
    );
  }

  @Version("1")
  @Post('login')
  @ApiConsumes('application/json')
  async login(@Body() body: LoginDto) {
    return await this.authService.login(body);
  }
}
