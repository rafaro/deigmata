import { Logger, Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { MockProvider } from './providers/mock.provider';
import * as config from 'config';
import { ProjectModule } from 'src/project/project.module';
import { AuthModule } from 'src/auth/auth.module';
import { RagRepository } from './rag.repository';
import { RagMessageModule } from 'src/rag-message/rag-message.module';

const llmProviderFactory = {
  provide: 'LLM_PROVIDER',
  useFactory: () => {
    const logger = new Logger('RagModule');
    const provider = config.has('llm.provider')
      ? config.get<string>('llm.provider')
      : 'openai';
    const openaiApiKey = config.has('llm.providers.openai.apiKey')
      ? config.get<string>('llm.providers.openai.apiKey')
      : '';
    const anthropicApiKey = config.has('llm.providers.anthropic.apiKey')
      ? config.get<string>('llm.providers.anthropic.apiKey')
      : '';
    logger.log(`[LLM] provider=${provider}`);
    switch (provider) {
      case 'anthropic':
        return new AnthropicProvider(anthropicApiKey);
      case 'mock':
        return new MockProvider();
      case 'openai':
      default:
        return new OpenAIProvider(openaiApiKey);
    }
  },
  inject: [],
};


@Module({
  imports: [RagMessageModule, ProjectModule, AuthModule],
  controllers: [RagController],
  providers: [
    RagService,
    EmbeddingService,
    llmProviderFactory,
    RagRepository
  ],
  exports: [RagService],
})
export class RagModule { }
