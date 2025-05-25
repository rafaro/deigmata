import { BaseDefaultEntity } from '../utils/Entity/BaseDefaultEntity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Assign } from 'src/assign/assign.entity';

@Entity()
export class User extends BaseDefaultEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 100,
    select: false,
  })
  password?: string;

  @Column({
    length: 100,
    select: false,
  })
  salt: string;

  @Column({
    length: 100,
    select: false,
    nullable: true,
  })
  recoverypwd: string;

  @Column({ type: 'timestamptz', select: false, nullable: true })
  recoverypwduntil: Date; //datetime DEFAULT NULL

  @Column({
    length: 100,
    select: false,
    nullable: true,
  })
  confirmemail?: string;

  @Index({ unique: true })
  @Column({
    length: 100,
  })
  email: string;

  @Column({
    length: 10,
  })
  role: string;

  // @Column({
  //   length: 100,
  //   nullable: true,
  // })
  // picture: string; //varchar(50) DEFAULT NULL,


  @Column({
    length: 100,
  })
  name: string;

  @Column({
    length: 80,
    nullable: true,
  })
  displayname: string;


  @Column({
    length: 2,
    nullable: true,
    select: false
  })
  status: string;

  @ManyToOne(() => Assign, { eager: false })
  @JoinColumn({ name: 'assignid' })
  assign?: Assign;

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }

  selfOrSuper(id: number): boolean {
    //return this.id === id || this.role === UserRoles.SUPER;
    return this.id === id;
  }
}
