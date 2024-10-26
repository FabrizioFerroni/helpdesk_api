import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateRolDto {
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  @ApiProperty()
  rol: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  description: string;
}
