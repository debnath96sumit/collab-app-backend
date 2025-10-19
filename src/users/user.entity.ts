import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Document } from '../documents/document.entity';
import { DocumentCollaborator } from '../documents/document-collaborator.entity';
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Document, (document) => document.owner)
  documents: Document[];

  @OneToMany(() => DocumentCollaborator, (collaborator) => collaborator.user)
  collaborations: DocumentCollaborator[];
}
