import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const SINGLETON_ID = "singleton";

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const existing = await this.prisma.appSettings.findUnique({ where: { id: SINGLETON_ID } });
    if (existing) return existing;
    return this.prisma.appSettings.create({ data: { id: SINGLETON_ID } });
  }

  async update(data: { geminiApiKey?: string; geminiModel?: string }) {
    await this.get();
    return this.prisma.appSettings.update({ where: { id: SINGLETON_ID }, data });
  }
}
