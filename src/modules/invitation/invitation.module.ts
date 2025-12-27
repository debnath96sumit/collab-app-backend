import { Module } from '@nestjs/common';
import { Invitation } from './entities/invitation.entity';
import { InvitationRepository } from './repositories/invitation.repository';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        TypeOrmModule.forFeature([Invitation]),
    ],
    providers: [InvitationRepository],
    exports: [InvitationRepository],
})
export class InvitationModule { }
