import { Body, Controller, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthRoles } from 'src/auth/auth-roles.enum';
import { Role } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { GetUser } from 'src/user/get-user.decorator';
import { User } from 'src/user/user.entity';
import { Assign } from './assign.entity';
import { AssignCreateDto } from './dto/assign-create-dto';
import { AssignService } from './assign.service';

@Controller('assign')
export class AssignController {
  constructor(private srv: AssignService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.USER)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(@GetUser() user: User, @Body() dto: AssignCreateDto): Promise<Assign> {
    return this.srv.create(user, dto);
  };
}
