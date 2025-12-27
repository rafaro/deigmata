import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { User } from 'src/user/user.entity';
import { RagMessage } from './rag-message.entity';
import { RagMessageRepository } from './rag-message.repository';
import { RagQueryDto } from 'src/rag/dto/rag-query-dto';
import { Project } from 'src/project/project.entity';
import { Rag } from 'src/rag/rag.entity';

@Injectable()
export class RagMessageService {
  constructor(
    private repo: RagMessageRepository,
    private readonly i18n: I18nService,
  ) { }

  async getById(id: number, user: User): Promise<RagMessage> {
    const message = await this.repo.getById(id, user);
    if (!message) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound', { args: { id } }));
    }
    return message;
  }

  async getAll(user: User): Promise<RagMessage[]> {
    return this.repo.getAll(user);
  }

  async create(dto: RagQueryDto, user: User, project: Project, rag: Rag): Promise<RagMessage> {


    const message = new RagMessage();
    message.user = user;
    message.project = project;
    message.rag = rag;

    message.model = dto.model;
    message.question = dto.question;
    message.temperature = dto.temperature;
    message.maxtokens = dto.maxTokens;
    message.topp = dto.topP;
    message.answer = dto.answer;


    return this.repo.save(message);
  }

  async update(id: number, dto: RagQueryDto, user: User): Promise<RagMessage> {
    const message = await this.getById(id, user);
    // const rag = await this.ragService.getById(dto.ragId, user);

    // if (rag.project?.id !== project.id) {
    //   throw new BadRequestException(this.i18n.t('msg.ragMessage.projectMismatch', {
    //     args: { projectId: project.id },
    //   }));
    // }

    //message.project = project;
    //message.rag = rag;
    // message.model = dto.model;
    // message.question = dto.question;
    // message.temperature = dto.temperature;
    // message.maxTokens = dto.maxTokens;

    return this.repo.save(message);
  }

  async delete(id: number, user: User): Promise<void> {
    await this.getById(id, user);
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound'));
    }
  }
}
