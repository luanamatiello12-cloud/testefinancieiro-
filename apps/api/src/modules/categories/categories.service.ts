import { Injectable, NotFoundException } from "@nestjs/common";
import { TransactionType } from "@sistema-financeiro/database";
import { CategoriesRepository } from "./categories.repository";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  findAll(type?: TransactionType) {
    return this.repository.findAll(type);
  }

  async findById(id: string) {
    const category = await this.repository.findById(id);
    if (!category) throw new NotFoundException("Categoria não encontrada");
    return category;
  }

  create(data: CreateCategoryDto) {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateCategoryDto) {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.softDelete(id);
  }
}
