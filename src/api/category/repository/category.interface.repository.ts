import { Injectable } from '@nestjs/common';
import { BaseAbstractRepository } from '@/config/database/mysql/mysql.base.repository';
import { UpdateResult } from 'typeorm';
import { CategoryEntity } from '../entity/category.entity';
import { CategoryType } from '../enum/category.enum';

@Injectable()
export abstract class CategoryInterfaceRepository extends BaseAbstractRepository<CategoryEntity> {
  abstract getAllCategories(
    skip?: number,
    take?: number,
    deletedAt?: boolean,
  ): Promise<[CategoryEntity[], number]>;
  abstract getCategoryById(
    id: string,
    deleted?: boolean,
  ): Promise<CategoryEntity>;
  abstract getCategoryByIdForType(
    id: string,
    type: CategoryType,
    deleted?: boolean,
  ): Promise<CategoryEntity>;
  abstract getCategoriesAndSubcategoriesForType(
    type: CategoryType,
  ): Promise<CategoryEntity[]>;
  abstract getCategoryByName(name: string): Promise<CategoryEntity>;
  abstract saveCategory(data: CategoryEntity): Promise<CategoryEntity>;
  abstract updateCategory(
    id: string,
    data: CategoryEntity,
  ): Promise<UpdateResult>;
  abstract deleteCategory(id: string): Promise<UpdateResult>;
  abstract restoreCategory(id: string): Promise<UpdateResult>;
  abstract obtainWithRelations(): Promise<CategoryEntity[]>;
  abstract categoryAlreadyExists(name: string, id?: string): Promise<boolean>;
  abstract subCategoryAlreadyExists(
    name: string,
    parent: CategoryEntity,
    type: CategoryType,
    id?: string,
  ): Promise<boolean>;
  abstract categoryAlreadyExistsById(
    id: string,
    deleted?: boolean,
  ): Promise<boolean>;
}
