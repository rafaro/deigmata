import { Module } from '@nestjs/common';
import { AssignService } from './assign.service';
import { AssignController } from './assign.controller';
import { AuthModule } from 'src/auth/auth.module';
import { AssignRepository } from './assign.repository';
import { ProjectRepository } from 'src/project/project.repository';

@Module({
  imports: [AuthModule],
  providers: [AssignService, AssignRepository, ProjectRepository],
  controllers: [AssignController]
})
export class AssignModule { }
