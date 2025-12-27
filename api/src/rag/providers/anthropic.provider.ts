import { Injectable } from '@nestjs/common';
import { ILLMProvider, ChatMessage, ChatOptions } from '../interfaces/llm.interface';

@Injectable()
export class AnthropicProvider implements ILLMProvider {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Anthropic não tem embedding nativo, usa Voyage AI ou OpenAI
    throw new Error('Use OpenAI ou outro provider para embeddings');
  }

  async generateChatCompletion(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    const systemMessages = messages.filter(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    const nucleusSampling =
      options?.topP !== undefined ? { top_p: options.topP } : {};

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2025-06-01',
      },
      body: JSON.stringify({
        model: options?.model || 'claude-3-5-sonnet',
        max_tokens: options?.maxTokens || 500,
        system: systemMessages.map(m => m.content).join('\n'),
        ...nucleusSampling,
        messages: userMessages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();
    return data.content[0].text;
  }
}
