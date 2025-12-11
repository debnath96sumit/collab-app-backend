import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../entities/document.entity';
import { BaseRepository } from '@/common/bases/base.repository';

@Injectable()
export class DocumentRepository extends BaseRepository<Document> {
    constructor(
        @InjectRepository(Document)
        repository: Repository<Document>,
    ) {
        super(repository);
    }
}