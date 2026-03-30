import {
  ConflictException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from '@/common/types/api-response.type';
import { LoginDto, RegisterDto } from '@/auth/dto/auth.dto';
import { UserRepository } from '@/modules/users/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { User } from '@/modules/users/user.entity';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@/common/enum/user-role.enum';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

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

    const { accessToken, refreshToken } = await this.issueTokens(user);
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
    const { accessToken, refreshToken } = await this.issueTokens(
      user,
      userAgent,
      ipAddress,
    );

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

  async issueTokens(user: any, userAgent?: string, ipAddress?: string) {
    const payload = { id: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = await this.generateRefreshToken(
      user.id,
      userAgent,
      ipAddress,
    );
    return { accessToken, refreshToken };
  }

  private async generateRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ token: string; expiresAt: Date; hashedToken: string }> {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(plainToken)
      .digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const record = await this.refreshTokenRepository.create({
      token: hashedToken,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return { token: plainToken, expiresAt: record.expiresAt, hashedToken };
  }

  async refreshAccessToken(refreshTokenString: string): Promise<ApiResponse> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(refreshTokenString)
      .digest('hex');

    const existingRefreshToken =
      await this.refreshTokenRepository.findByCondition(
        { token: hashedToken },
        {
          relations: ['user'],
        },
      );

    if (!existingRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existingRefreshToken.isRevoked) {
      // Replay attack detected. Revoke all tokens for this user.
      await this.refreshTokenRepository.updateByField(
        { userId: existingRefreshToken.user.id },
        { isRevoked: true, revokedAt: new Date() },
      );
      throw new UnauthorizedException(
        'Security alert: Refresh token reuse detected. All sessions revoked.',
      );
    }

    if (new Date() > existingRefreshToken.expiresAt) {
      await this.refreshTokenRepository.remove(existingRefreshToken.id);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const { accessToken, refreshToken } = await this.issueTokens(
      existingRefreshToken.user,
    );

    // Instead of removing, mark as revoked and store the replacement token
    await this.refreshTokenRepository.updateById(existingRefreshToken.id, {
      isRevoked: true,
      revokedAt: new Date(),
      replacedByToken: refreshToken.hashedToken,
    });

    return {
      message: 'Access token refreshed successfully',
      data: {
        accessToken,
        refreshToken: refreshToken.token,
      },
    };
  }

  async logout(refreshTokenString: string): Promise<ApiResponse> {
    if (!refreshTokenString) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(refreshTokenString)
      .digest('hex');
    const refreshToken = await this.refreshTokenRepository.findByCondition({
      token: hashedToken,
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
