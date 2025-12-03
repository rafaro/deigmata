import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';

const llmProviderFactory = {
  provide: 'LLM_PROVIDER',
  useFactory: () => {
    switch (LLM_PROVIDER) {
      case 'anthropic':
        return new AnthropicProvider();
      case 'openai':
      default:
        return new OpenAIProvider();
    }
  },
};

@Module({
  controllers: [RagController],
  providers: [
    RagService,
    EmbeddingService,
    llmProviderFactory,
  ],
})
export class RagModule { }