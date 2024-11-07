import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { TicketStatus } from '../enum/ticket-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeStatusTicketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(3)
  comments: string;
}
