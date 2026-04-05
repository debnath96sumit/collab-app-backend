import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { UserRepository } from '@/modules/users/user.repository';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@/common/interfaces/common.interface';
import { REDIS_CONNECTION } from '@/common/redis/redis.provider';
import Redis from 'ioredis';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userRepository: UserRepository,
    readonly configService: ConfigService,
    @Inject(REDIS_CONNECTION) private readonly redisService: Redis
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
    done: VerifiedCallback,
  ) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    const isBlacklisted = await this.redisService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return done(new UnauthorizedException(
        "Token has been invalidated. Please log in again."
      ), false);
    }
    const { id } = payload;
    const user = await this.userRepository.findOneById(id);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }
}
