import { Injectable, Inject } from '@nestjs/common';
import { ILLMProvider } from './interfaces/llm.interface';

@Injectable()
export class EmbeddingService {
  constructor(
    @Inject('LLM_PROVIDER') private llmProvider: ILLMProvider,
  ) { }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.llmProvider.generateEmbedding(text);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );
    return embeddings;
  }
}