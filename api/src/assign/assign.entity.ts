import { User } from 'src/user/user.entity';
import { Project } from 'src/project/project.entity';
import { BaseDefaultEntity } from '../utils/Entity/BaseDefaultEntity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';


@Entity()
export class Assign extends BaseDefaultEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 100,
  })
  name: string;

  @ManyToOne(() => User, (users) => users.assign, { eager: false, nullable: true })
  @JoinColumn({ name: 'userid' })
  users: User[];

  @ManyToOne(() => Project, (projects) => projects.assign, { eager: false, nullable: true })
  @JoinColumn({ name: 'projectid' })
  projects: Project[];

}
