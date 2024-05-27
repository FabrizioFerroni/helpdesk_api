export type ConfigApp = {
  env: string;
  apiPort: number;
  redis: ConfigAppRedis;
  ttl: number;
  limit: number;
  max_pass_failures: number;
  secret_jwt: string;
  secret_jwt_register: string;
  mailServiceUrl: string;
  passPrivateKey: string;
  database: DbConfig;
};

export type ConfigAppRedis = {
  host: string;
  port: number;
  username: string;
  password: string;
  ttl: number;
};

export type DbConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};
