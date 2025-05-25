import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from 'src/user/user.repository';
import { AuthCredentialsDto } from './dto/auth-crententials-dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserRepository)
    private repo: UserRepository,
    private jwtService: JwtService,
    private readonly i18n: I18nService
  ) { }
  async signIn(
    authCrendentialDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string; }> {
    const jwtPayload = await this.repo.validateUserPassword(authCrendentialDto);

    if (!jwtPayload) {
      throw new UnauthorizedException(this.i18n.t('msg.invalidCredentials'));
    }

    //const payload: JwtPayload = {email};
    const accessToken = await this.jwtService.sign(jwtPayload);
    return { accessToken };
  }
}

