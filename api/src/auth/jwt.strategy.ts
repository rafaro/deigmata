import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as config from 'config';
import { UserRepository } from 'src/user/user.repository';
import { User } from 'src/user/user.entity';
import { JwtPayload } from './jwt-payload.interface';
import { I18nService } from 'nestjs-i18n';

const secret: string = config.get('jwt.secret');
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserRepository)
    private rep: UserRepository,
    private readonly i18n: I18nService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }
  async validate(payload: JwtPayload): Promise<User> {
    const { id } = payload;
    const user = await this.rep.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException(this.i18n.t('msg.authNotConfirmed'));
    }
    return user;
  }
}
