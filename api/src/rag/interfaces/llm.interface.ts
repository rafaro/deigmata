export interface ILLMProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateChatCompletion(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  topP?: number;
}
