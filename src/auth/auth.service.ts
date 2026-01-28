import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from '@/common/types/api-response.type';
import { LoginDto } from '@/auth/dto/auth.dto';
import { UserRepository } from '@/modules/users/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from './entities/refresh-token.entity';
import { Jwtpayload } from '@/common/interfaces/common.interface';
import { User } from '@/modules/users/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<ApiResponse> {
    const user = await this.userRepo.findByCondition({ email: loginDto.email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!(await user.comparePassword(loginDto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.generateAccessToken(user);
    const refreshToken = loginDto.rememberMe
      ? await this.generateRefreshToken(user.id, userAgent, ipAddress)
      : null;

    return {
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken: refreshToken?.token || null,
        refreshTokenExpiry: refreshToken?.expiresAt || null,
        user,
      },
    };
  }

  private generateAccessToken(user: User): string {
    const payload: Jwtpayload = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
    });
  }

  private async generateRefreshToken(
    userId: number,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshToken> {
    const token = uuidv4();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return await this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    });
  }

  async refreshAccessToken(refreshTokenString: string): Promise<ApiResponse> {
    // Find refresh token in database
    const refreshToken = await this.refreshTokenRepository.findByCondition(
      { token: refreshTokenString },
      {
        relations: ['user'],
      },
    );

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date() > refreshToken.expiresAt) {
      await this.refreshTokenRepository.remove(refreshToken.id);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const accessToken = this.generateAccessToken(refreshToken.user);

    return {
      message: 'Access token refreshed successfully',
      data: {
        accessToken,
        user: {
          id: refreshToken.user.id,
          username: refreshToken.user.username,
          email: refreshToken.user.email,
        },
      },
    };
  }

  async logout(refreshTokenString: string): Promise<ApiResponse> {
    if (!refreshTokenString) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const refreshToken = await this.refreshTokenRepository.findByCondition({
      token: refreshTokenString,
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date() > refreshToken.expiresAt) {
      await this.refreshTokenRepository.remove(refreshToken.id);
      throw new UnauthorizedException('Refresh token has expired');
    }

    await this.refreshTokenRepository.updateById(refreshToken.id, {
      isRevoked: true,
    });

    return {
      statusCode: 200,
      message: 'Logged out successfully',
    };
  }
}
