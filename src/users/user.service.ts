// users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>
    ) { }

    async create(email: string, username: string, password: string): Promise<User> {
        const hashed = await bcrypt.hash(password, 10);
        const user = this.userRepo.create({ email, username, password: hashed });
        return this.userRepo.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepo.findOne({ where: { email } });
    }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.findByEmail(email);
        if (user && await bcrypt.compare(password, user.password)) {
            return user;
        }
        return null;
    }
}
