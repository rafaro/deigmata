import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProjectCreateDto } from './dto/project-create-dto';
import { ProjectService } from './project.service';
import { AuthGuard } from '@nestjs/passport';
import { AuthRoles } from 'src/auth/auth-roles.enum';
import { Role } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Project } from './project.entity';
import { ProjectPatchKgDto } from './dto/project-patch-kg-dto';
import { GetUser } from 'src/user/get-user.decorator';
import { User } from 'src/user/user.entity';

@Controller('project')
export class ProjectController {
  constructor(private srv: ProjectService) { }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  getbyId(@GetUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<Project> {
    return this.srv.getById(id, user);
  };

  @Get('kg/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  getkgById(@GetUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<Project> {
    return this.srv.getKgById(id, user);
  };

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  getAll(@GetUser() user: User): Promise<Project[]> {
    return this.srv.getAll(user);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  @UsePipes(ValidationPipe)
  create(@Body() dto: ProjectCreateDto): Promise<void> {
    return this.srv.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  update(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: ProjectCreateDto,
  ): Promise<Project> {
    return this.srv.update(id, dto, user);
  }

  @Patch('kg/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  updateKg(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProjectPatchKgDto,
  ): Promise<Project> {
    return this.srv.updateKg(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.srv.delete(id);
  }

  @Post('init')
  init(): Promise<void> {
    return this.srv.init();
  }
}
