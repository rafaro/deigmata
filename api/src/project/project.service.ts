import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from './project.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectCreateDto } from './dto/project-create-dto';
import { ProjectPatchKgDto } from './dto/project-patch-kg-dto';
import { I18nService } from 'nestjs-i18n';
import { User } from 'src/user/user.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(ProjectRepository)
    private repo: ProjectRepository,
    private readonly i18n: I18nService
  ) { }

  async getById(id: number, user: User): Promise<Project> {
    const found = await this.repo.getById(id, user);
    if (!found) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound', { args: { id } }));
    }
    return found;
  }

  async getKgById(id: number, user: User): Promise<Project> {
    const found = await this.repo.getKg(id, user);
    if (!found) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound', { args: { id } }));
    }
    return found;
  }

  async create(dto: ProjectCreateDto, user: User): Promise<void> {
    const { name } = dto;
    const obj = new Project();
    obj.name = name;
    obj.user = user;
    obj.kg = dto.kg;


    try {
      await obj.save();
    } catch (e) {
      switch (e.name) {
        case 'QueryFailedError':
          throw new ConflictException(this.i18n.t('msg.alreadyRegistered', {
            args: {
              desc: this.i18n.t('name.project')
            }
          }));
        default:
          throw new InternalServerErrorException();
      }
    }
  }

  async update(id: number, dto: ProjectCreateDto, user: User): Promise<Project> {
    const obj = await this.getById(id, user);
    const { name, layout, kg } = dto;

    obj.name = name;
    obj.layout = layout;
    obj.kg = kg;

    return await this.repo.save(obj);
  }

  async updateKg(id: number, dto: ProjectPatchKgDto, user: User): Promise<Project> {
    const obj = await this.getById(id, user);
    const { kg } = dto;

    obj.kg = kg;

    return await this.repo.save(obj);

  }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound'));
    }
  }
  async getAll(user: User): Promise<Project[]> {
    return await this.repo.getAll(user);
  }

  async init(): Promise<void> {
    const obj = new Project();
    obj.name = 'Initial project';
    obj.layout = 'cose';
    obj.public = 'Y';
    obj.kg = JSON.parse(`{"nodes":[{"data":{"id":"Fadiga","label":"Sintoma"},"position":{"x":435.43126845067434,"y":37.90119624084101},"group":"nodes","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":false,"classes":""},{"data":{"id":"group_doenca","label":"Doenças"},"position":{"x":320.00616438356167,"y":-87.17061643835618},"group":"nodes","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":false,"classes":""},{"data":{"id":"COVID-19","label":"Doença","parent":"group_doenca"},"position":{"x":320.00616438356167,"y":-54.79561643835616},"group":"nodes","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":false,"classes":""},{"data":{"id":"Gripe","label":"Doença","parent":"group_doenca"},"position":{"x":332.28616438356164,"y":-119.54561643835618},"group":"nodes","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":false,"classes":""},{"data":{"id":"Febre","label":"Sintoma"},"position":{"x":171.67219178082192,"y":-134.45479452054795},"group":"nodes","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":false,"classes":""},{"data":{"id":"Tosse","label":"Sintoma"},"position":{"x":81.54246575342464,"y":15.138219178082185},"group":"nodes","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":false,"classes":""},{"data":{"id":"Ibuprofeno","label":"Medicamento"},"position":{"x":89.04931506849314,"y":121.79136986301366},"group":"nodes","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":false,"classes":""},{"data":{"id":"Paracetamol","label":"Medicamento"},"position":{"x":24.21082191780822,"y":-145.21575342465752},"group":"nodes","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":false,"classes":""},{"data":{"id":"Clínico Geral","label":"Especialidade Médica"},"position":{"x":560.4671232876711,"y":-120.31561643835616},"group":"nodes","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":false,"classes":""},{"data":{"id":"Pneumologista","label":"Especialidade Médica"},"position":{"x":556.9249315068494,"y":-53.45191780821919},"group":"nodes","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":false,"classes":""}],"edges":[{"data":{"id":"covid_febre","source":"COVID-19","target":"Febre","label":"causa"},"position":{"x":0,"y":0},"group":"edges","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":true,"classes":""},{"data":{"id":"covid_tosse","source":"COVID-19","target":"Tosse","label":"causa"},"position":{"x":0,"y":0},"group":"edges","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":true,"classes":""},{"data":{"id":"covid_fadiga","source":"COVID-19","target":"Fadiga","label":"causa"},"position":{"x":0,"y":0},"group":"edges","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":true,"classes":""},{"data":{"id":"gripe_febre","source":"Gripe","target":"Febre","label":"causa"},"position":{"x":0,"y":0},"group":"edges","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":true,"classes":""},{"data":{"id":"gripe_tosse","source":"Gripe","target":"Tosse","label":"causa"},"position":{"x":0,"y":0},"group":"edges","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":true,"classes":""},{"data":{"id":"febre_paracetamol","source":"Febre","target":"Paracetamol","label":"tratado por"},"position":{"x":0,"y":0},"group":"edges","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":true,"classes":""},{"data":{"id":"covid_pneumologista","source":"COVID-19","target":"Pneumologista","label":"tratado por"},"position":{"x":0,"y":0},"group":"edges","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":true,"classes":""},{"data":{"id":"gripe_clinico","source":"Gripe","target":"Clínico Geral","label":"tratado por"},"position":{"x":0,"y":0},"group":"edges","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":true,"classes":""},{"data":{"id":"tosse_ibuprofeno","source":"Tosse","target":"Ibuprofeno","label":"tratado por"},"position":{"x":0,"y":0},"group":"edges","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"pannable":true,"classes":""}]}`);
    try {
      await obj.save();
    } catch (e) {
      switch (e.name) {
        case 'QueryFailedError':
          throw new ConflictException(this.i18n.t('msg.alreadyRegistered', {
            args: {
              desc: this.i18n.t('name.project')
            }
          }));
        default:
          throw new InternalServerErrorException();
      }
    }
  }


}
