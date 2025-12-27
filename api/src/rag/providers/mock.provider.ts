import { Injectable, Logger } from '@nestjs/common';
import { ChatMessage, ChatOptions, ILLMProvider } from '../interfaces/llm.interface';

@Injectable()
export class MockProvider implements ILLMProvider {
  private readonly logger = new Logger(MockProvider.name);
  private chatCalls = 0;

  async generateEmbedding(text: string): Promise<number[]> {
    const seed = text.split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
    const vector = Array.from(
      { length: 8 },
      (_, idx) => Number((((seed + idx * 13) % 1000) / 1000).toFixed(6)),
    );

    this.logger.debug(`Mock embedding generated for text length=${text.length}`);
    return vector;
  }

  async generateChatCompletion(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    this.chatCalls += 1;
    const lastUserMessage = [...messages].reverse().find(message => message.role === 'user');
    const preview = lastUserMessage?.content
      ? lastUserMessage.content.replace(/\s+/g, ' ').slice(0, 120)
      : 'no user question provided';
    const temperature = options?.temperature ?? 0.7;
    const model = options?.model ?? 'mock-model';

    const response = `Mock answer #${this.chatCalls} (model=${model}, temperature=${temperature}) → ${preview}`;
    this.logger.debug(`Mock chat completion generated: call=${this.chatCalls}`);
    return response;
  }

}
