import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './user.service';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UsersService, UserRepository],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule { }
