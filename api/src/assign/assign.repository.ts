import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Assign } from './assign.entity';

@Injectable()
export class AssignRepository extends Repository<Assign> {

  constructor(private ds: DataSource) {
    super(Assign, ds.createEntityManager());
  }
}