import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @ApiProperty()
  @MinLength(3)
  @IsNotEmpty()
  name: string;
}
