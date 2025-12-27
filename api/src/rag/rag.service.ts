import { Injectable, Inject, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ILLMProvider } from './interfaces/llm.interface';
import { ProjectService } from 'src/project/project.service';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { RagQueryDto } from './dto/rag-query-dto';
import { User } from 'src/user/user.entity';
import { RagCreateDto } from './dto/rag-create-dto';
import { RagRepository } from './rag.repository';
import { Rag } from './rag.entity';
import { RagMessageService } from 'src/rag-message/rag-message.service';
import * as config from 'config';
import { RagMessage } from 'src/rag-message/rag-message.entity';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    @Inject('LLM_PROVIDER') private llmProvider: ILLMProvider,
    private repo: RagRepository,
    private embeddingService: EmbeddingService,
    private projectService: ProjectService,
    private ragMessageService: RagMessageService,
    private readonly i18n: I18nService,
    @InjectDataSource() private dataSource: DataSource,
  ) { }

  private getAnswerMaxLength(): number | undefined {
    const column = this.dataSource
      .getMetadata(RagMessage)
      .findColumnWithPropertyName('answer');
    const length = column?.length;
    if (!length) {
      return undefined;
    }
    const parsedLength = Number(length);
    return Number.isFinite(parsedLength) ? parsedLength : undefined;
  }

  private extractTextFromKG(kg: any): string {
    if (!kg) return '';

    let parsedKg = kg;

    if (typeof kg === 'string') {
      try {
        parsedKg = JSON.parse(kg);
      } catch (error) {
        this.logger.warn(`Failed to parse KG string, using raw value. Error: ${error}`);
        return kg;
      }
    }

    if (typeof parsedKg === 'object' && parsedKg !== null) {
      const edges = Array.isArray(parsedKg.edges) ? parsedKg.edges : [];
      const triples = edges
        .map((edge: any) => edge?.data)
        .filter((data: any) => data?.source && data?.label && data?.target)
        .map((data: any) => `${data.source} -> ${data.label} -> ${data.target}`);

      const nodes = Array.isArray(parsedKg.nodes) ? parsedKg.nodes : [];
      const groupLabels = new Map<string, string>();
      const groupMembers = new Map<string, Set<string>>();

      nodes.forEach((node: any) => {
        const data = node?.data ?? {};
        const nodeId = data?.id;
        const nodeLabel = data?.label ?? data?.name ?? data?.id;
        if (nodeId && nodeLabel) {
          groupLabels.set(nodeId, nodeLabel);
        }
        if (data?.parent) {
          const parentId = data.parent;
          const memberLabel = data?.id ?? data?.label ?? data?.name;
          if (memberLabel) {
            if (!groupMembers.has(parentId)) {
              groupMembers.set(parentId, new Set());
            }
            groupMembers.get(parentId)?.add(memberLabel);
          }
        }
      });

      const groupLines = Array.from(groupMembers.entries()).map(([groupId, members]) => {
        const groupName = groupLabels.get(groupId) ?? groupId;
        return `${groupName}: ${Array.from(members).join(', ')}`;
      });

      const sections = [];
      if (triples.length > 0) {
        sections.push(triples.join('\n'));
      }
      if (groupLines.length > 0) {
        sections.push(groupLines.join('\n'));
      }
      if (sections.length > 0) {
        return sections.join('\n');
      }

      return JSON.stringify(parsedKg, null, 2);
    }

    return String(kg);
  }

  async create(dto: RagCreateDto, user: User): Promise<Rag> {
    const project = await this.projectService.getById(dto.projectId, user);

    const rag = new Rag();
    rag.project = project;
    rag.user = user;

    try {
      return await this.repo.save(rag);
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  async getById(id: number, user: User): Promise<Rag> {
    const rag = await this.repo.getById(id, user);
    if (!rag) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound', { args: { id } }));
    }
    return rag;
  }

  async getAll(user: User): Promise<Rag[]> {
    return await this.repo.getAll(user);
  }

  async update(id: number, dto: RagCreateDto, user: User): Promise<Rag> {
    const rag = await this.getById(id, user);
    const project = await this.projectService.getById(dto.projectId, user);

    rag.project = project;
    return this.repo.save(rag);
  }

  async delete(id: number, user: User): Promise<void> {
    await this.getById(id, user);

    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound'));
    }
  }

  async getMessageById(id: number, user: User): Promise<Rag> {
    const rag = await this.repo.getMessageById(id, user);
    if (!rag) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound', { args: { id } }));
    }
    return rag;
  }

  async query(dto: RagQueryDto, user: User): Promise<string> {
    const { question, projectId, ragId } = dto;
    const lang = I18nContext.current()?.lang;
    const project = await this.projectService.getKgById(projectId, user);


    if (!project) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound', {
        lang,
        args: { id: projectId },
      }));
    }
    if (!project.kg) {
      throw new NotFoundException(this.i18n.t('msg.project.kgNotFound', {
        lang,
        args: { id: projectId },
      }));
    }

    const rag = await this.getById(ragId, user);
    if (!rag) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound', { args: { id: ragId } }));
    }

    const context = [
      this.extractTextFromKG(project.kg),
    ].filter(Boolean).join('\n\n');
    const systemPrompt = this.i18n.t('msg.rag.prompt.system', { lang });
    const userPrompt = this.i18n.t('msg.rag.prompt.user', {
      lang,
      args: { context, question },
    });

    dto.maxTokens = dto.maxTokens ?? 500;
    const resolvedModel = dto.model ?? (config.has('llm.model') ? config.get<string>('llm.model') : undefined);
    const answer = await this.llmProvider.generateChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      model: resolvedModel,
      topP: dto.topP,
    });

    const maxAnswerLength = this.getAnswerMaxLength();
    let trimmedAnswer = answer;
    if (maxAnswerLength && answer.length > maxAnswerLength) {
      this.logger.warn(
        `[RAG] answer trimmed: length=${answer.length} max=${maxAnswerLength} ` +
        `projectId=${projectId} ragId=${ragId} model=${resolvedModel ?? 'default'}`,
      );
      trimmedAnswer = answer.slice(0, maxAnswerLength);
    }

    dto.question = question;
    dto.answer = trimmedAnswer;
    dto.model = resolvedModel;


    await this.ragMessageService.create(dto, user, project, rag);

    return trimmedAnswer;
  }
}
