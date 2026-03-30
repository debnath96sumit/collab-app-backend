import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Document } from '@/modules/documents/entities/document.entity';
import { User } from '@/modules/users/user.entity';
import {
  CollaboratorRole,
  CollaboratorStatus,
} from '@/common/enum/common.enum';

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
  userId: string;

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

  @Column({ type: 'varchar', nullable: true, unique: true })
  token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  joinedAt: Date | null;

  @CreateDateColumn()
  invitedAt: Date;
}
