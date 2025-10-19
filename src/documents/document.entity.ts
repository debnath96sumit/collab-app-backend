import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DocumentVersion } from './document-version.entity';
import { User } from '../users/user.entity';
import {
  CollaboratorRole,
  DocumentCollaborator,
} from './document-collaborator.entity';
@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => DocumentVersion, (version) => version.document, {
    cascade: true,
  })
  versions: DocumentVersion[];
  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ nullable: true })
  owner_id: number;

  @Column({ default: 'restricted' })
  linkAccess: string;

  @Column({
    type: 'enum',
    enum: CollaboratorRole,
    default: CollaboratorRole.VIEWER,
  })
  linkPermission: CollaboratorRole;

  @Column({ unique: true })
  shareToken: string;

  @OneToMany(() => DocumentCollaborator, (collab) => collab.document, {
    cascade: true,
  })
  collaborators: DocumentCollaborator[];
}
