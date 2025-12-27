import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentCollaborator } from '../entities/document-collaborator.entity';
import { BaseRepository } from '@/common/bases/base.repository';

@Injectable()
export class DocumentCollaboratorRepository extends BaseRepository<DocumentCollaborator> {
  constructor(
    @InjectRepository(DocumentCollaborator)
    repository: Repository<DocumentCollaborator>,
  ) {
    super(repository);
  }
}
