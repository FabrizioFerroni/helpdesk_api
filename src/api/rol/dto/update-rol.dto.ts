import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRolDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @ApiProperty()
  rol: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @ApiProperty()
  description: string;
}
