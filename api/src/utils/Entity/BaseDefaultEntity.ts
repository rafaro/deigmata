import { BaseEntity, Column, BeforeInsert, BeforeUpdate } from 'typeorm';

export class BaseDefaultEntity extends BaseEntity {
  @Column({ type: 'timestamp without time zone', nullable: true })
  updatedat?: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  createdat?: Date;

  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    this.createdat = new Date();
    this.updatedat = this.createdat;
  }

  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    this.updatedat = new Date();
  }

}