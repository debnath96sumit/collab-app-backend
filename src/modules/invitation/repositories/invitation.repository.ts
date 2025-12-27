import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from '../entities/invitation.entity';
import { BaseRepository } from '@/common/bases/base.repository';

@Injectable()
export class InvitationRepository extends BaseRepository<Invitation> {
  constructor(
    @InjectRepository(Invitation)
    repository: Repository<Invitation>,
  ) {
    super(repository);
  }
}
