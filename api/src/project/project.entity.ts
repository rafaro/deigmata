import { Assign } from 'src/assign/assign.entity';
import { BaseDefaultEntity } from '../utils/Entity/BaseDefaultEntity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from 'src/user/user.entity';

@Entity()
export class Project extends BaseDefaultEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({
    length: 100,
  })
  name: string;

  @Column({
    length: 50,
    nullable: true
  })
  layout: string;

  @Column({
    length: 1,
    default: 'N'
  })
  public: string;


  @Column("text", { select: false, nullable: true })
  kg?: string;

  @ManyToOne(() => Assign, { eager: false })
  @JoinColumn({ name: 'assignid' })
  assign?: Assign;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'ownerid' })
  user?: User;

}
