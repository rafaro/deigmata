import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { AssignModule } from './assign/assign.module';
import { AcceptLanguageResolver, I18nJsonLoader, I18nModule } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  //https://nestjs-i18n.com/quick-start
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      loader: I18nJsonLoader,
      resolvers: [
        { use: AcceptLanguageResolver, options: { matchType: 'strict' } }
      ],
    }),
    UserModule, ProjectModule, AssignModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
