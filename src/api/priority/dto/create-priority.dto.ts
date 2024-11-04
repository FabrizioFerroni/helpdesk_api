import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePriorityDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;
}
