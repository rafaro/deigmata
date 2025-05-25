import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ProjectRepository } from './project.repository';

@Module({
  imports: [AuthModule],
  providers: [ProjectService, ProjectRepository],
  controllers: [ProjectController]
})
export class ProjectModule { }
