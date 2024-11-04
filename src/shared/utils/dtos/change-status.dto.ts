import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ChangeStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  @Type(() => Boolean)
  status: boolean;
}
