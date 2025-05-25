import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserFilterDto } from './dto/user-filter-dto';
import { UserCreateDto } from './dto/user-create-dto';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import { UserUpdateAdminDto } from './dto/user-update-admin-dto';
import * as fs from 'fs';
import * as path from 'path';
import { UserUpdatePwdDto } from './dto/user-update-pwd-dto';
//import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { AuthRoles } from 'src/auth/auth-roles.enum';
import { v4 as uuidv4 } from 'uuid';
import { UserChangePwdDto } from './dto/user-change-pwd-dto';
import { Pagination } from '../utils/paginate';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private repo: UserRepository,
    private readonly i18n: I18nService
  ) { }

  async getById(id: number): Promise<User> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound', { args: { id } }));
    }
    return found;
  }

  async getByUser(user: User): Promise<User> {
    const found = await this.repo.findOne({ where: { id: user.id } });
    if (!found) {
      throw new NotFoundException(this.i18n.t('msg.recordNotFound', { args: { id: user.id } }));
    }
    return found;
  }

  async getAllPsy(dto: UserFilterDto): Promise<Pagination<User>> { //Promise<User[]> {
    return this.repo.getAllByFilter(dto);
  }

  async create(dto: UserCreateDto): Promise<void> {
    //return this.repo.createUser(dto);
    const { name, password, email } = dto;
    const obj = new User();
    obj.name = name;
    obj.email = email;
    obj.confirmemail = uuidv4();
    obj.salt = await bcrypt.genSalt();
    obj.password = await this.repo.hashPassword(password, obj.salt);
    obj.role = AuthRoles.GUEST;

    //this.srvMail.sendConfirmationEmail(obj, obj.confirmemail);
    try {
      await obj.save();
    } catch (e) {
      switch (e.name) {
        case 'QueryFailedError':
          throw new ConflictException(this.i18n.t('msg.alreadyRegistered', {
            args: {
              desc: 'email'
            }
          }));
        default:
          throw new InternalServerErrorException();
      }
    }
  }

  async updateAdmin(id: number, dto: UserUpdateAdminDto): Promise<User> {
    const obj = await this.getById(id);
    const { email, role, status, slug } = dto;
    obj.email = email;
    obj.role = role;
    obj.status = status;
    return await obj.save();
  }


  //  async updatePicture(user: User, file: Express.Multer.File): Promise<void> {
  //   const obj = await this.getById(user.id);
  //   obj.picture = file.filename;
  //   await obj.save();
  //   return;
  // }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(this.i18n.t('msg.noRecordRemoved'));
    }
  }
  // async getAll(dto: UserFilterDto): Promise<User[]> {
  //   return await this.repo.getAllByFilter(dto);
  // }

  async getAllAsAdmin(user: User, dto: UserFilterDto): Promise<User[]> {
    return await this.repo.getAllByFilterAsAdmin(user, dto);
  }


  async changePwd(user: User, dto: UserChangePwdDto): Promise<void> {
    return await this.repo.changePwd(user, dto);
  }
  async resendConfirmEmail(user: User): Promise<void> {
    const found = await this.repo.getRecoveryConfirm(user.id);
    if (found.confirmemail) {
      found.confirmemail = uuidv4();
      //this.srvMail.sendConfirmationEmail(found, found.confirmemail);
      try {
        await found.save();
      } catch (e) {
        switch (e.response.name) {
          case 'QueryFailedError':
            throw new ConflictException(this.i18n.t('msg.email.alreadyRegistered'));
          default:
            throw new InternalServerErrorException();
        }
      }
    } else {
      throw new ConflictException(this.i18n.t('msg.email.alreadyConfirmed'));
    }

  }

  async confirmEmail(hash: string): Promise<void> {
    return await this.repo.confirmEmail(hash);
  };

  async resetPwd(email: string): Promise<void> {
    const obj = await this.repo.getByEmail(email);
    if (!obj) {
      throw new ConflictException(this.i18n.t('msg.email.passwordResetFailed'));
    } else {
      obj.recoverypwd = uuidv4();
      obj.recoverypwduntil = new Date();
      obj.recoverypwduntil.setDate(obj.recoverypwduntil.getDate() + 1);
      //this.srvMail.resetPwd(obj, obj.recoverypwd);
      try {
        await obj.save();
      } catch (e) {
        switch (e.response.name) {
          case 'QueryFailedError':
            throw new ConflictException(this.i18n.t('msg.email.alreadyRegistered'));
          default:
            throw new InternalServerErrorException();
        }
      }
    }
  };

  // async emailInfo(dto: UserEmailInfoDto): Promise<void> {
  //   // const found = await this.repo.getByEmail('rafaro@gmail.com');
  //   const list = await this.repo.getEmailByRole(dto.to as AuthRoles);
  //   let delay = 5000;
  //   list.forEach(o => {
  //     this.srvMail.sendInfo(o, dto.subject, dto.body, delay);
  //     delay += 5000;
  //   });
  // }

  async updatePwd(
    dto: UserUpdatePwdDto,
    hash: string,
  ): Promise<void> {
    return await this.repo.updatePwd(dto, hash);
  }

  async init(): Promise<void> {
    //return this.repo.createUser(dto);
    const obj = new User();
    obj.name = 'test';
    obj.email = 'test@test.com';
    obj.confirmemail = uuidv4();
    obj.salt = await bcrypt.genSalt();
    obj.password = await this.repo.hashPassword('testtest', obj.salt);
    obj.role = AuthRoles.USER;

    //this.srvMail.sendConfirmationEmail(obj, obj.confirmemail);
    try {
      await obj.save();
    } catch (e) {
      switch (e.name) {
        case 'QueryFailedError':
          throw new ConflictException(this.i18n.t('msg.alreadyRegistered', {
            args: {
              desc: 'email'
            }
          }));
        default:
          throw new InternalServerErrorException();
      }
    }
  }



};
