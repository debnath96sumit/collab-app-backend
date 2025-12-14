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

    async getDocumentFullDetails(id: string) {
        return this.repository.findOne({
            where: {
                id,
            },
            relations: {
                owner: true,
                collaborators: {
                    user: true,
                },
            },
            select: {
                owner: {
                    id: true,
                    username: true,
                    email: true,
                },
                collaborators: {
                    id: true,
                    role: true,
                    status: true,
                    invitedEmail: true,
                    user: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });
    }
}