import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tag.findMany({ orderBy: { name: "asc" } });
  }

  async findOrCreateByName(name: string) {
    const normalized = name.trim();
    const all = await this.prisma.tag.findMany();
    const existing = all.find((t) => t.name.toLowerCase() === normalized.toLowerCase());
    if (existing) return existing;
    return this.prisma.tag.create({ data: { name: normalized } });
  }
}
