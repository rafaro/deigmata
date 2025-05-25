import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthRoles } from 'src/auth/auth-roles.enum';
import { Role } from 'src/auth/roles.decorator';
import { UserFilterDto } from './dto/user-filter-dto';
import { UserCreateDto } from './dto/user-create-dto';
import { User } from './user.entity';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { GetUser } from './get-user.decorator';
import { UserUpdateAdminDto } from './dto/user-update-admin-dto';
import { UserUpdatePwdDto } from './dto/user-update-pwd-dto';
import { UserChangePwdDto } from './dto/user-change-pwd-dto';
//import { Pagination } from '../utils/paginate';
import { UserEmailInfoDto } from './dto/user-email-info-dto';


@Controller('user')
export class UserController {
  constructor(private srv: UserService) { }

  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() dto: UserCreateDto): Promise<void> {
    return this.srv.create(dto);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.GUEST)
  getUserByAuth(@GetUser() user: User): Promise<User> {
    return this.srv.getByUser(user);
  };

  @Post('email/resendconfirm')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.GUEST)
  resendConfirmEmail(@GetUser() user: User): Promise<void> {
    return this.srv.resendConfirmEmail(user);
  };

  @Patch('email/:hash/confirm')
  emailConfirm(@Param('hash') hash: string): Promise<void> {
    return this.srv.confirmEmail(hash);
  };

  // @Post('email/info')
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles(AuthRoles.SUPER)
  // @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  // sendInfo(@Body() dto: UserEmailInfoDto): Promise<void> {
  //   return this.srv.emailInfo(dto);
  // };

  @Patch('pwd/change')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.GUEST)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  changePwd(
    @GetUser() user: User,
    @Body(ValidationPipe) dto: UserChangePwdDto,
  ): Promise<void> {
    return this.srv.changePwd(user, dto);
  };

  @Post('pwd/reset')
  resetPwd(@Body('email') email: string): Promise<void> {
    return this.srv.resetPwd(email);
  };

  @Patch('pwd/:hash/update')
  updatePwd(
    @Body(ValidationPipe) dto: UserUpdatePwdDto,
    @Param('hash') hash: string,
  ): Promise<void> {
    return this.srv.updatePwd(dto, hash);
  };

  @Get('adm')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.SUPER)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  getAllAsAdmin(@GetUser() user: User, @Query() dto: UserFilterDto): Promise<User[]> {
    return this.srv.getAllAsAdmin(user, dto);
  };

  @Get(':id/adm')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.SUPER)
  getByAdmin(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.srv.getById(id);
  };

  @Patch(':id/adm')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Role(AuthRoles.SUPER)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  updateByAdmin(@Param('id', ParseIntPipe) id: number, @Body() dto: UserUpdateAdminDto): Promise<User> {
    return this.srv.updateAdmin(id, dto);
  };

  @Post('init')
  init(): Promise<void> {
    return this.srv.init();
  }
}
