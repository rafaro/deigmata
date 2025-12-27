import { Module } from '@nestjs/common';
import { RagMessageRepository } from './rag-message.repository';
import { RagMessageService } from './rag-message.service';

@Module({
  imports: [],
  controllers: [],
  providers: [RagMessageService, RagMessageRepository],
  exports: [RagMessageService],
})
export class RagMessageModule { }
