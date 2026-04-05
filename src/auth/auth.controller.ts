import {
  Controller,
  Post,
  Body,
  Version,
  HttpCode,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '@/auth/auth.service';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
} from '@/auth/dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) { }

  @Version('1')
  @Post('register')
  @ApiConsumes('application/json')
  async register(@Body() body: RegisterDto) {
    return await this.authService.register(body);
  }

  @Version('1')
  @Post('login')
  @HttpCode(200)
  @ApiConsumes('application/json')
  async login(@Body() body: LoginDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.ip;
    return await this.authService.login(body, userAgent, ipAddress);
  }

  @Version('1')
  @Post('refresh-token')
  @ApiConsumes('application/json')
  async refresh(@Body() body: RefreshTokenDto) {
    const refreshToken = body.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return await this.authService.refreshAccessToken(refreshToken);
  }

  @Version('1')
  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('application/json')
  async logout(@Body() body: LogoutDto, @Req() req: Request) {
    return await this.authService.logout(body.refreshToken, req);
  }
}
