import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as config from 'config';

//const type: string = config.get('db.type');
const host = config.get<string>('db.host') || 'localhost';
const port = config.get<number>('db.port') || 5432;
const username = config.get<string>('db.username') || 'postgres';
const password = config.get<string>('db.password') || 'Postgres2018';
const database = config.get<string>('db.database') || 'deigmata';
const sync = config.get<boolean>('db.sync') || false;
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: host,
  port: port,
  username: username,
  password: password,
  database: database,
  logging: false,
  entities: [
    __dirname + '/../!(node_modules)**/*.entity.{js,ts}',
  ],
  synchronize: sync,
};
