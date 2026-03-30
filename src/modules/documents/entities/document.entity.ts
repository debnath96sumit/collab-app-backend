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
import { User } from '@/modules/users/user.entity';
import { DocumentCollaborator } from '@/modules/documents/entities/document-collaborator.entity';
import { CollaboratorRole, LinkAccess } from '@/common/enum/common.enum';
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

  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ nullable: true })
  owner_id: string;

  @Column({
    type: 'enum',
    enum: LinkAccess,
    default: LinkAccess.RESTRICTED,
  })
  linkAccess: LinkAccess;

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
