import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assign } from './assign.entity';
import { AssignRepository } from './assign.repository';
import { AuthRoles } from 'src/auth/auth-roles.enum';
import { User } from 'src/user/user.entity';
import { AssignCreateDto } from './dto/assign-create-dto';
import { ProjectRepository } from 'src/project/project.repository';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AssignService {
  constructor(
    @InjectRepository(AssignRepository)
    private repo: AssignRepository,

    @InjectRepository(ProjectRepository)
    private repoProj: ProjectRepository,

    private readonly i18n: I18nService
  ) { }

  async getById(id: number): Promise<Assign> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound', { args: { id } }));
    }
    return found;
  }

  async create(user: User, dto: AssignCreateDto): Promise<Assign> {
    const { name, projectid } = dto;

    const project = await this.repoProj.findOneBy({ id: projectid });
    const obj = new Assign();

    obj.name = name;
    obj.users = [user];
    obj.projects = [project];

    return this.repo.save(obj);
  }


  async update(id: number, dto: AssignCreateDto): Promise<Assign> {
    const obj = await this.getById(id);
    const { name } = dto;

    obj.name = name;

    return await this.repo.save(obj);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(this.i18n.t('msg.noRecordRemoved'));
    }
  }
  async getAll(): Promise<Assign[]> {
    return await this.repo.find();
  }
}
