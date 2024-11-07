export type ConfigApp = {
  env: string;
  apiPort: number;
  redis: ConfigAppRedis;
  ttl: number;
  limit: number;
  max_pass_failures: number;
  secret_jwt: string;
  secret_jwt_register: string;
  secret_jwt_refresh: string;
  mailServiceUrl: string;
  passPrivateKey: string;
  database: DbConfig;
  emailDefaultFabrizio: string;
  passwordDefaultFabrizio: string;
  passwordDefaultAdmin: string;
  passwordDefaultSoporte: string;
  appHost: string;
  appMail: string;
  appImg: string;
  exchange: string;
  appColor: string;
  appEmailFrom: string;
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
  timezone: string;
};
