import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private ragService: RagService) { }

  @Post('query')
  async query(@Body() body: { question: string; }) {
    if (!body.question) {
      throw new BadRequestException('Question é obrigatória');
    }

    const answer = await this.ragService.query(body.question);
    return { question: body.question, answer };
  }
}