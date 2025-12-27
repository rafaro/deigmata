import { BaseDefaultEntity } from 'src/utils/Entity/BaseDefaultEntity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';
import { Project } from 'src/project/project.entity';
import { RagMessage } from 'src/rag-message/rag-message.entity';
import { User } from 'src/user/user.entity';

@Entity()
export class Rag extends BaseDefaultEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 1,
    default: 'N'
  })
  public: string;

  @ManyToOne(() => Project, { eager: false, nullable: false })
  @JoinColumn({ name: 'projectid' })
  project: Project;

  @OneToMany(() => RagMessage, (ragMessage) => ragMessage.rag, { eager: false })
  @JoinColumn({ name: 'ragid' })
  ragmessages: RagMessage[];

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'ownerid' })
  user?: User;
}
