import { DataSource, Repository } from 'typeorm';
import { UserFilterDto } from './dto/user-filter-dto';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { AuthCredentialsDto } from 'src/auth/dto/auth-crententials-dto';
//import { UserCreateDto } from './dto/user-create-dto';
import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AuthRoles } from '../auth/auth-roles.enum';
import { UserUpdatePwdDto } from './dto/user-update-pwd-dto';
import { UserChangePwdDto } from './dto/user-change-pwd-dto';
import { Pagination } from '../utils/paginate';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UserRepository extends Repository<User> {

  readonly select = ['o.id', 'o.name'];
  readonly where = "o.status = 'A' ";
  constructor(
    private ds: DataSource,
    private readonly i18n: I18nService
  ) {
    super(User, ds.createEntityManager());
  }
  async validateUserPassword(
    authCrendentialsDto: AuthCredentialsDto,
  ): Promise<JwtPayload> {
    const { email, password } = authCrendentialsDto;
    const q = this.createQueryBuilder('o');
    q.andWhere('o.email = :email', { email });
    q.addSelect(['o.password', 'o.salt', 'o.confirmemail']);

    const obj = await q.getOne();
    if (obj && (await obj.validatePassword(password))) {
      const jwtPayLoad: JwtPayload = {
        id: obj.id,
        email: obj.email,
        name: obj.name,
        role: obj.role,
        confirmedemail: obj.confirmemail ? false : true,
      };
      return jwtPayLoad;
    } else {
      return null;
    }
  }

  async getAllByFilter(dto: UserFilterDto): Promise<Pagination<User>> {//Promise<User[]> {
    const { limit = 20, page = 1 } = dto;
    const q = this.createQueryBuilder('o');
    q.select([...this.select, 'e', 'c']);
    q.addOrderBy('o.name', 'ASC');

    q.limit(limit);
    q.offset(limit * (page - 1));

    const [results, total] = await q.getManyAndCount();
    return new Pagination<User>({ results, total, page, totalperpage: limit });
  }


  async getEmailByRole(role: AuthRoles): Promise<User[]> {
    const q = this.createQueryBuilder('o');
    q.select(['o.id', 'o.name', 'o.gender', 'o.email']);
    if (role !== AuthRoles.SUPER) {
      q.andWhere("o.role = :role", { role });
    }
    q.andWhere("o.status = 'A'");
    return await q.getMany();
  }

  async getAllByFilterAsAdmin(user: User, dto: UserFilterDto): Promise<User[]> {

    if (user.role !== AuthRoles.SUPER) {
      throw new NotFoundException(this.i18n.t('msg.noRecordsFoundAdmin'));
    }
    const q = this.createQueryBuilder('o');

    q.addOrderBy('o.id', 'DESC');
    const list = await q.getMany();
    return list;
  }


  async confirmEmail(hash: string): Promise<void> {
    const q = this.createQueryBuilder('o');
    q.andWhere('o.confirmemail = :hash', { hash });
    q.addSelect(['o.confirmemail']);

    const obj = await q.getOne();
    if (!obj) {
      throw new ConflictException(this.i18n.t('msg.email.notConfirmed'));
    } else {
      obj.confirmemail = null;
      obj.role = AuthRoles.USER;
      try {
        obj.save();
      } catch (e) {
        switch (e.response.name) {
          case 'QueryFailedError':
            throw new ConflictException(this.i18n.t('msg.email.alreadyRegistered'));
          default:
            throw new InternalServerErrorException();
        }
      }
    }
    return null;
  }

  async getByEmail(email: string): Promise<User> {
    const q = this.createQueryBuilder('o');
    q.andWhere('o.email = :email', { email });
    return await q.getOne();
  }

  async getRecoveryConfirm(id: number): Promise<User> {
    const q = this.createQueryBuilder('o');
    q.andWhere('o.id = :id', { id });
    q.addSelect(['o.confirmemail', 'o.recoverypwd', 'o.recoverypwduntil']);
    return await q.getOne();
  }

  async updatePwd(
    dto: UserUpdatePwdDto,
    hash: string,
  ): Promise<void> {
    const q = this.createQueryBuilder('o');
    q.andWhere('o.recoverypwd = :hash', { hash });
    q.addSelect(['o.recoverypwd', 'o.recoverypwduntil']);
    const obj = await q.getOne();
    if (!obj || obj.recoverypwduntil < new Date()) {
      throw new ConflictException(
        this.i18n.t('msg.email.invalidRecoveryLink'),
      );
    } else {
      obj.salt = await bcrypt.genSalt();
      obj.password = await this.hashPassword(
        dto.password,
        obj.salt,
      );
      obj.recoverypwd = null;
      try {
        obj.save();
      } catch (e) {
        switch (e.response.name) {
          case 'QueryFailedError':
            throw new ConflictException(this.i18n.t('msg.email.alreadyRegistered'));
          default:
            throw new InternalServerErrorException();
        }
      }
    }
  }
  async changePwd(user: User, dto: UserChangePwdDto): Promise<void> {
    const q = this.createQueryBuilder('o');
    q.andWhere('o.id = :id', { id: user.id });
    q.addSelect(['o.password', 'o.salt']);
    const obj = await q.getOne();
    if (obj && (await obj.validatePassword(dto.password))) {
      obj.salt = await bcrypt.genSalt();
      obj.password = await this.hashPassword(
        dto.newpassword,
        obj.salt,
      );
      try {
        obj.save();
      } catch (e) {
        switch (e.response.name) {
          case 'QueryFailedError':
            throw new ConflictException(this.i18n.t('msg.email.alreadyRegistered'));
          default:
            throw new InternalServerErrorException();
        }
      }
    } else {
      throw new NotFoundException(this.i18n.t('msg.password.changeFailed'));
    }

    return;
  }

  public async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }


}
