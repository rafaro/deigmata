import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Rag } from './rag.entity';
import { User } from 'src/user/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { RagMessage } from 'src/rag-message/rag-message.entity';

@Injectable()
export class RagRepository extends Repository<Rag> {
  constructor(@InjectDataSource() private ds: DataSource) {
    super(Rag, ds.createEntityManager());
  }

  async getAll(user: User): Promise<Rag[]> {
    const q = this.createQueryBuilder('r');
    q.leftJoinAndSelect('r.project', 'p');
    q.leftJoin(
      (subQ) =>
        subQ
          .subQuery()
          .select('rm2.ragid', 'ragid')
          .addSelect('rm2.question', 'question')
          .from(RagMessage, 'rm2')
          .distinctOn(['rm2.ragid'])
          .orderBy('rm2.ragid', 'ASC')
          .addOrderBy('rm2.id', 'ASC'),
      'rm',
      'rm.ragid = r.id'
    );
    q.addSelect('rm.question', 'firstQuestion');
    q.where("p.public = 'Y'");
    q.orWhere('p.ownerid = :id', { id: user.id });
    q.orderBy('r.id', 'DESC');
    const { entities, raw } = await q.getRawAndEntities();
    return entities.map((entity, index) => {
      (entity as Rag & { firstQuestion?: string | null }).firstQuestion =
        raw[index]?.firstQuestion ?? null;
      return entity;
    });
  }

  async getById(id: number, user: User): Promise<Rag> {
    const q = this.createQueryBuilder('r');
    q.where('r.id = :id', { id });
    q.andWhere("(r.public = 'Y' or r.ownerid = :userId)", { userId: user.id });
    return q.getOne();
  }

  async getMessageById(id: number, user: User): Promise<Rag> {
    const q = this.createQueryBuilder('r');
    q.leftJoinAndSelect('r.project', 'p');
    q.leftJoinAndSelect('r.ragmessages', 'rm');
    q.where('r.id = :id', { id });
    q.andWhere("(r.public = 'Y' or r.ownerid = :userId)", { userId: user.id });
    q.orderBy('rm.id', 'DESC');
    return q.getOne();
  }
}
