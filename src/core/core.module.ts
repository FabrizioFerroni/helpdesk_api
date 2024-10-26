import { configApp } from '@/config/app/config.app';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaginationService } from './services/pagination.service';
import { MailService } from './services/mail.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: false,
      envFilePath: [`${process.cwd()}/.env`], //.${process.env.NODE_ENV}.local
      load: [configApp],
    }),
    HttpModule,
  ],
  providers: [PaginationService, MailService],
  exports: [PaginationService, MailService],
})
export class CoreModule {}
