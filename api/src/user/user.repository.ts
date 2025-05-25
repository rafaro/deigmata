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

@Injectable()
export class UserRepository extends Repository<User> {

  readonly select = ['o.id', 'o.name'];
  readonly where = "o.status = 'A' ";
  constructor(private ds: DataSource) {
    super(User, ds.createEntityManager());
  }
  async validateUserPassword(
    authCrendentialsDto: AuthCredentialsDto,
  ): Promise<JwtPayload> {
    const { email, password } = authCrendentialsDto;
    //Rafael Rocha - 06/09/2020
    //Usar  findone em campo que não é PK causa erro
    //QueryFailedError: ORA-00933: SQL command not properly ended
    //const objs = await this.find({ CND_EMAIL: email }).add("user.password");
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
    //const list = await q.getMany();
    //const objs: CandidatoListaDto[] = cands.map(
    //   c => {
    //     const o: CandidatoListaDto = {
    //       CND_NOME: c.CND_NOME,
    //       CND_EMAIL: c.CND_EMAIL,
    //       CND_CONFIRMA_EMAIL: !c.CND_CONFIRMA_EMAIL,
    //       CND_DADOS_COMPLETO: c.canSubscribe()
    //     };
    //     return o;
    //   });
    //return list;

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
      throw new NotFoundException('Nenhum registro encontrado. (SPR)');
    }
    const q = this.createQueryBuilder('o');
    // q.innerJoinAndSelect('o.estado', 'e');
    // q.innerJoinAndSelect('o.cidade', 'c');
    //q.andWhere('o.role = :role ', { role: `%${CND_NOME}%` });
    //q.andWhere('o.role = :role ', { role: AuthRoles.PSI });

    q.addOrderBy('o.id', 'DESC');
    //q.skip
    //q.take
    //q.offset
    //q.limit    
    const list = await q.getMany();
    // const objs: CandidatoListaDto[] = cands.map(
    //   c => {
    //     const o: CandidatoListaDto = {
    //       CND_NOME: c.CND_NOME,
    //       CND_EMAIL: c.CND_EMAIL,
    //       CND_CONFIRMA_EMAIL: !c.CND_CONFIRMA_EMAIL,
    //       CND_DADOS_COMPLETO: c.canSubscribe()
    //     };
    //     return o;
    //   });
    return list;
  }


  async confirmEmail(hash: string): Promise<void> {
    const q = this.createQueryBuilder('o');
    q.andWhere('o.confirmemail = :hash', { hash });
    q.addSelect(['o.confirmemail']);

    const obj = await q.getOne();
    if (!obj) {
      throw new ConflictException('Seu email não foi confirmado');
    } else {
      obj.confirmemail = null;
      obj.role = AuthRoles.USER;
      try {
        obj.save();
      } catch (e) {
        switch (e.response.name) {
          case 'QueryFailedError':
            throw new ConflictException('Este email já está cadastrado.');
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
        'Este link não é válido. Solicite novo link ou verifique sua caixa de entrada do email.',
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
            throw new ConflictException('Este email já está cadastrado.');
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
            throw new ConflictException('Este email já está cadastrado.');
          default:
            throw new InternalServerErrorException();
        }
      }
    } else {
      throw new NotFoundException('Não foi possível mudar sua senha. Tente mais tarde');
    }

    return;
  }

  public async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }


}