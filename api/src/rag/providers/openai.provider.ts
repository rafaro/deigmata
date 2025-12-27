import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ILLMProvider, ChatMessage, ChatOptions } from '../interfaces/llm.interface';

@Injectable()
export class OpenAIProvider implements ILLMProvider {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async generateChatCompletion(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    const nucleusSampling =
      options?.topP !== undefined ? { top_p: options.topP } : {};
    const response = await this.openai.chat.completions.create({
      model: options?.model || 'gpt-5',
      messages: messages as any,
      temperature: options?.temperature || 0.7,
      ...nucleusSampling,
      max_tokens: options?.maxTokens || 500,
    });
    return response.choices[0].message.content;
  }
}
