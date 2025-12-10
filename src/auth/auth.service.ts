import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/users/user.service';
import { ApiResponse } from '@/common/types/api-response.type';
import { LoginDto } from '@/auth/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async login(loginDto: LoginDto): Promise<ApiResponse> {
    const user = await this.usersService.validateUser(loginDto.email, loginDto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const payload = { username: user.username, id: user.id };
    return {
      statusCode: 200,
      message: 'Login successful',
      data: {
        user,
        access_token: this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
        }),
      },
    };
  }
}
