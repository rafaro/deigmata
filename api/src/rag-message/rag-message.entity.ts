import { BaseDefaultEntity } from 'src/utils/Entity/BaseDefaultEntity';
import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from 'src/project/project.entity';
import { Rag } from 'src/rag/rag.entity';
import { User } from 'src/user/user.entity';

@Entity()
export class RagMessage extends BaseDefaultEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  model: string;

  @Column({ length: 400 })
  question: string;

  @Column({ length: 400 })
  answer: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0.7, nullable: true })
  temperature?: number;

  @Column({ name: 'max_tokens', type: 'int', nullable: true })
  maxtokens?: number;

  @Column({ name: 'top_p', type: 'decimal', precision: 3, scale: 2, nullable: true })
  topp?: number;

  @ManyToOne(() => Project, { eager: false, nullable: false })
  @JoinColumn({ name: 'projectid' })
  project: Project;

  @ManyToOne(() => Rag, { eager: false, nullable: false })
  @JoinColumn({ name: 'ragid' })
  rag: Rag;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'ownerid' })
  user?: User;



}
