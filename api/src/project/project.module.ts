import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ProjectRepository } from './project.repository';
import { CsvKgTransformService } from './csv-kg-transform.service';
import { TurtleKgTransformService } from './turtle-kg-transform.service';

@Module({
  imports: [AuthModule],
  providers: [ProjectService, ProjectRepository, CsvKgTransformService, TurtleKgTransformService],
  controllers: [ProjectController],
  exports: [ProjectService],
})
export class ProjectModule { }
