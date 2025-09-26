import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
  ) {}

  findAll() {
    return this.documentRepo.find();
  }

  findOne(id: string) {
    return this.documentRepo.findOneBy({ id });
  }

  create(title: string) {
    const doc = this.documentRepo.create({ title });
    return this.documentRepo.save(doc);
  }

  async update(id: string, content: string) {
    await this.documentRepo.update(id, { content });
    return this.findOne(id);
  }

  async remove(id: string) {
    const doc = await this.findOne(id);
    if (!doc) {
      return null;
    }
    return this.documentRepo.remove(doc);
  }
}
