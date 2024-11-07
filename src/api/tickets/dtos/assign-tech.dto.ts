import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTechDto {
  @IsUUID()
  @IsNotEmpty()
  @Type(() => String)
  @ApiProperty()
  assigned_tech_id: string;
}
