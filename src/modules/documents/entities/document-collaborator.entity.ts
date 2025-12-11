import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Document } from '@/modules/documents/entities/document.entity';
import { User } from '@/modules/users/user.entity';

export enum CollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  COMMENTER = 'commenter',
  VIEWER = 'viewer',
}

export enum CollaboratorStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
}

@Entity('document_collaborators')
export class DocumentCollaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Document, (document) => document.collaborators, {
    onDelete: 'CASCADE',
  })
  document: Document;

  @Column()
  documentId: string;

  @ManyToOne(() => User, (user) => user.collaborations)
  user: User;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  invitedEmail: string;

  @Column({
    type: 'enum',
    enum: CollaboratorRole,
    default: CollaboratorRole.VIEWER,
  })
  role: CollaboratorRole;

  @Column({
    type: 'enum',
    enum: CollaboratorStatus,
    default: CollaboratorStatus.PENDING,
  })
  status: CollaboratorStatus;

  @CreateDateColumn()
  invitedAt: Date;
}
