import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentVersion } from '../entities/document-version.entity';
import { BaseRepository } from '@/common/bases/base.repository';

@Injectable()
export class DocumentVersionRepository extends BaseRepository<DocumentVersion> {
    constructor(
        @InjectRepository(DocumentVersion)
        repository: Repository<DocumentVersion>,
    ) {
        super(repository);
    }
}