import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RagMessage } from './rag-message.entity';
import { User } from 'src/user/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class RagMessageRepository extends Repository<RagMessage> {
  constructor(@InjectDataSource() private ds: DataSource) {
    super(RagMessage, ds.createEntityManager());
  }

  async getAll(user: User): Promise<RagMessage[]> {
    const q = this.createQueryBuilder('rs');
    q.leftJoinAndSelect('rs.project', 'p');
    q.leftJoinAndSelect('rs.rag', 'r');
    q.where("p.public = 'Y'");
    q.orWhere('p.ownerid = :id', { id: user.id });
    q.orderBy('rs.id', 'DESC');
    return q.getMany();
  }

  async getById(id: number, user: User): Promise<RagMessage> {
    const q = this.createQueryBuilder('rs');
    q.leftJoinAndSelect('rs.project', 'p');
    q.leftJoinAndSelect('rs.rag', 'r');
    q.where('rs.id = :id', { id });
    q.andWhere("(p.public = 'Y' or p.ownerid = :userId)", { userId: user.id });
    return q.getOne();
  }
}
