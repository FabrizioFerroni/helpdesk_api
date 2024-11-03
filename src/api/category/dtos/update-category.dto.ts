import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  name: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  status: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
