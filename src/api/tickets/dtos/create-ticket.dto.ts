import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  priority_id: string;
}
