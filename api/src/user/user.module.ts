import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { AuthModule } from '../auth/auth.module';
//import { MailModule } from '../mail/mail.module';

@Module({
  imports: [AuthModule],
  providers: [UserService, UserRepository],
  controllers: [UserController],
})
export class UserModule { }
