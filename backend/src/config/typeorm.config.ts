import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'event_calendar',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  // Логирование SQL: true = все запросы, false = отключено, по умолчанию только ошибки
  logging: process.env.TYPEORM_LOGGING === 'true' ? true : process.env.TYPEORM_LOGGING === 'false' ? false : ['error'],
};

export default new DataSource(typeOrmConfig);
