import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Project } from './project.entity';
import { User } from 'src/user/user.entity';

@Injectable()
export class ProjectRepository extends Repository<Project> {

  constructor(private ds: DataSource) {
    super(Project, ds.createEntityManager());
  }

  async getAll(user: User): Promise<Project[]> {
    const q = this.createQueryBuilder('p');
    q.orWhere("p.public = 'Y'");
    q.orWhere('p.ownerid = :id', { id: user.id });


    const obj = await q.getMany();
    return obj;
  }

  async getById(id: number, user: User): Promise<Project> {
    const q = this.createQueryBuilder('p');
    q.andWhere('p.id = :id', { id });
    q.andWhere("((p.public = 'Y' and p.id = :id) or (p.ownerid = :iduser))", { id, iduser: user.id });

    const obj = await q.getOne();
    return obj;
  }

  async getKg(id: number, user: User): Promise<Project> {
    const q = this.createQueryBuilder('p');
    q.andWhere('p.id = :id', { id });
    q.andWhere("((p.public = 'Y' and p.id = :id) or (p.ownerid = :iduser))", { id, iduser: user.id });
    q.addSelect(['p.kg']);

    const obj = await q.getOne();
    return obj;
  }
}