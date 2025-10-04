import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Document } from './document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
  ) {}

  findAllByParams(params: FindManyOptions<Document>) {
    return this.documentRepo.find(params);
  }

  findOne(id: string) {
    return this.documentRepo.findOneBy({ id });
  }

  create(doc: Partial<Document>) {
    return this.documentRepo.save(doc);
  }

  async update(id: string, updateData: Partial<Document>) {
    await this.documentRepo.update(id, updateData);
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
