import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Document } from './document.entity';

@Entity()
export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Document, (doc) => doc.versions, { onDelete: 'CASCADE' })
  document: Document;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
