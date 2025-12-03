import { Injectable, Inject } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ILLMProvider } from './interfaces/llm.interface';
import { map } from 'rxjs';
import { ProjectService } from 'src/project/project.service';

@Injectable()
export class RagService {
  constructor(
    @Inject('LLM_PROVIDER') private llmProvider: ILLMProvider,
    private embeddingService: EmbeddingService,
    private projectService: ProjectService,
  ) { }


  private chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }

    return chunks;
  }
  private extractTextFromKG(kg: any): string {
    if (!kg) return '';

    if (typeof kg === 'string') {
      return kg;
    }

    if (typeof kg === 'object') {
      return JSON.stringify(kg, null, 2);
    }

    return String(kg);
  }

  async indexProject(projectId: number): Promise<void> {
    const project = await this.projectService.getKgById(projectId, { id: 0 } as any);

    if (!project || !project.kg) {
      throw new Error('Project or KG not found');
    }

    // Extrai texto do campo KG
    const kgText = this.extractTextFromKG(project.kg);

    if (!kgText) {
      throw new Error('No text found in KG field');
    }


    // Chunking do texto
    const chunks = this.chunkText(kgText);
    const embeddings = await this.embeddingService.generateEmbeddings(chunks);

    // Prepara documentos para indexação
    const documentChunks = chunks.map((chunk, idx) => ({
      id: `project_${projectId}_chunk_${idx}`,
      text: chunk,
      metadata: {
        projectId,
        projectName: project.name,
        chunkIndex: idx,
        totalChunks: chunks.length,
      },
    }));

    //await this.vectorStore.addDocuments(documentChunks, embeddings);
  }

  async query(question: string): Promise<string> {
    const questionEmbedding = await this.embeddingService.generateEmbedding(question);
    const relevantDocs = new Array();//await this.vectorStore.search(questionEmbedding, 5);

    const context = relevantDocs.map(doc => doc.text).join('\n\n');

    const systemPrompt = `Você é um assistente útil que responde perguntas baseado no contexto fornecido.
      Use apenas as informações do contexto para responder. Se a resposta não estiver no contexto, diga que não tem essa informação.`;

    const userPrompt = `Contexto:
      ${context}
        
      Pergunta: ${question}

      Resposta:`;

    const answer = await this.llmProvider.generateChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.7,
      maxTokens: 500,
    });

    return answer;
  }
}