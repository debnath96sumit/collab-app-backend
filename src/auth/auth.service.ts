import { ConflictException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from '@/common/types/api-response.type';
import { LoginDto, RegisterDto } from '@/auth/dto/auth.dto';
import { UserRepository } from '@/modules/users/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtPayload } from '@/common/interfaces/common.interface';
import { User } from '@/modules/users/user.entity';
import { ConfigService } from '@nestjs/config';
import { generateUUID } from '@/common/utils/uuid';
import { UserRole } from '@/common/enum/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) { }

  async register(dto: RegisterDto): Promise<ApiResponse> {
    const checkUserExits = await this.userRepo.findByCondition({
      email: dto.email,
    });
    if (checkUserExits) {
      throw new ConflictException('User with this email already exists');
    }
    const checkUsernameExits = await this.userRepo.findByCondition({
      username: dto.username,
    });
    if (checkUsernameExits) {
      throw new ConflictException('User with this username already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepo.create({
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
      fullName: dto.fullName,
      role: UserRole.USER,
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully',
      data: {
        accessToken,
        refreshToken: refreshToken?.token || null,
        refreshTokenExpiry: refreshToken?.expiresAt || null,
        user,
      },
    };
  }

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<ApiResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
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
    const payload: JwtPayload = {
      id: user.id,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
    });
  }

  private async generateRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshToken> {
    const token = await generateUUID();

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

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findByCondition({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }
}
