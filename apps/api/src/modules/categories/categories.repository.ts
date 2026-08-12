import { Injectable } from "@nestjs/common";
import { TransactionType } from "@sistema-financeiro/database";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(type?: TransactionType) {
    return this.prisma.category.findMany({
      where: { deletedAt: null, ...(type ? { type } : {}) },
      orderBy: { name: "asc" },
    });
  }

  findById(id: string) {
    return this.prisma.category.findFirst({ where: { id, deletedAt: null } });
  }

  create(data: CreateCategoryDto) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
