import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BaseAbstractRepository } from '@/config/database/mysql/mysql.base.repository';
import {
  FindManyOptions,
  FindOneOptions,
  IsNull,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryEntity } from '../entity/category.entity';
import { CategoryInterfaceRepository } from './category.interface.repository';
import { CategoryMessagesError } from '../error/error.messages';
import { CategoryType } from '../enum/category.enum';

export class CategoryRepository
  extends BaseAbstractRepository<CategoryEntity>
  implements CategoryInterfaceRepository
{
  constructor(
    @InjectRepository(CategoryEntity)
    public repository: Repository<CategoryEntity>,
  ) {
    super(repository);
  }

  async getAllCategories(
    skip?: number,
    take?: number,
    deletedAt?: boolean,
  ): Promise<[CategoryEntity[], number]> {
    const options: FindManyOptions<CategoryEntity> = {
      skip,
      take,
      relations: ['parent'],
      order: {
        createdAt: 'DESC',
      },
    };

    if (deletedAt) {
      options.withDeleted = true;
      options.where = { deletedAt: Not(IsNull()) };
    } else {
      options.where = { deletedAt: IsNull() };
    }

    return await this.findAndCount(options);
  }

  async getCategoryById(
    id: string,
    deleted?: boolean,
  ): Promise<CategoryEntity> {
    const option = {
      where: {
        id: id,
      },
      relations: ['parent'],
      withDeleted: deleted,
    };
    return await this.findByCondition(option);
  }

  async getCategoryByIdForType(
    id: string,
    type: CategoryType,
    deleted?: boolean,
  ): Promise<CategoryEntity> {
    const option = {
      where: {
        id: id,
        type: type,
      },
      relations: ['parent'],
      withDeleted: deleted,
    };
    return await this.findByCondition(option);
  }

  async getCategoriesAndSubcategoriesForType(
    type: CategoryType,
  ): Promise<CategoryEntity[]> {
    const options: FindOneOptions<CategoryEntity> = {
      where: {
        type: type,
        deletedAt: IsNull(),
        status: true,
      },
      relations: ['parent'],
    };

    const result = await this.findAll(options);

    return result;
  }

  async getCategoryByName(name: string): Promise<CategoryEntity> {
    const option = {
      where: {
        name: name,
      },
      relations: ['parent'],
    };
    return await this.findByCondition(option);
  }

  async getCategoriesAndSubcategoriesForParentId({
    id,
  }: CategoryEntity): Promise<CategoryEntity[]> {
    const option: FindManyOptions<CategoryEntity> = {
      where: {
        parent: { id },
        status: true,
      },
      relations: ['parent'],
    };
    return await this.findAll(option);
  }

  async saveCategory(data: CategoryEntity): Promise<CategoryEntity> {
    const create: CategoryEntity = this.create(data);
    const categorySaved: CategoryEntity = await this.save(create);

    if (!categorySaved)
      throw new BadRequestException(CategoryMessagesError.CATEGORY_ERROR);

    return categorySaved;
  }

  async updateCategory(
    id: string,
    data: CategoryEntity,
  ): Promise<UpdateResult> {
    return await this.update(id, data);
  }

  async deleteCategory(id: string): Promise<UpdateResult> {
    return await this.softDelete(id);
  }

  async restoreCategory(id: string) {
    return await this.restore(id);
  }

  async obtainWithRelations(): Promise<CategoryEntity[]> {
    const options = {
      relations: {},
    };
    return await this.findWithRelations(options);
  }

  async categoryAlreadyExists(name: string, id?: string): Promise<boolean> {
    let result: CategoryEntity;

    if (!id) {
      const options = {
        where: {
          name: String(name),
        },
      };

      result = await this.findByCondition(options);
    } else {
      const options = {
        where: {
          name: String(name),
          id: Not(id),
        },
      };

      result = await this.findByCondition(options);
    }

    return !!result;
  }

  async subCategoryAlreadyExists(
    name: string,
    parent: CategoryEntity,
    type: CategoryType,
    id?: string,
  ): Promise<boolean> {
    let result: CategoryEntity;

    if (!id) {
      const options: FindOneOptions<CategoryEntity> = {
        where: {
          name: name,
          type: type,
          parent: parent,
        },
      };

      result = await this.findByCondition(options);
    } else {
      const options = {
        where: {
          name: name,
          type: type,
          parent: parent,
          id: Not(id),
        },
      };

      result = await this.findByCondition(options);
    }

    return !!result;
  }

  async categoryAlreadyExistsById(
    id: string,
    deleted?: boolean,
  ): Promise<boolean> {
    const options = {
      where: {
        id: id,
      },
      withDeleted: deleted,
    };

    return await this.exists(options);
  }
}
