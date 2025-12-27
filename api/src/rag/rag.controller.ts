import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagQueryDto } from './dto/rag-query-dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthRoles } from 'src/auth/auth-roles.enum';
import { Role } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { GetUser } from 'src/user/get-user.decorator';
import { User } from 'src/user/user.entity';
import { RagCreateDto } from './dto/rag-create-dto';
import { Rag } from './rag.entity';

@Controller('rag')
export class RagController {
  constructor(private ragService: RagService) { }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  getAll(@GetUser() user: User): Promise<Rag[]> {
    return this.ragService.getAll(user);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  getById(@GetUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<Rag> {
    return this.ragService.getById(id, user);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(@GetUser() user: User, @Body() dto: RagCreateDto): Promise<Rag> {
    return this.ragService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  update(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RagCreateDto,
  ): Promise<Rag> {
    return this.ragService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  delete(@GetUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ragService.delete(id, user);
  }

  @Post('message/query')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  async query(@GetUser() user: User, @Body() dto: RagQueryDto) {

    const answer = await this.ragService.query(dto, user);
    return { answer };
  }

  @Get('message/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  getMessageById(@GetUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<Rag> {
    return this.ragService.getMessageById(id, user);
  }
}
