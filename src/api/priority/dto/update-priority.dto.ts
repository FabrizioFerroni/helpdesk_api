import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePriorityDto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  name: string;
}
