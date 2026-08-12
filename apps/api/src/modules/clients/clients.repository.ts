import { Injectable } from "@nestjs/common";
import { TransactionType } from "@sistema-financeiro/database";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

const DEFAULT_CATEGORIES: Record<"income" | "outsourced", { name: string; type: TransactionType; color: string; icon: string }> = {
  income: { name: "Serviços Prestados", type: "INCOME", color: "#14b8a6", icon: "briefcase" },
  outsourced: { name: "Terceirizados", type: "EXPENSE", color: "#f97316", icon: "users" },
};

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  findById(id: string) {
    return this.prisma.client.findFirst({ where: { id, deletedAt: null } });
  }

  create(data: CreateClientDto) {
    return this.prisma.client.create({ data });
  }

  update(id: string, data: UpdateClientDto) {
    return this.prisma.client.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  jobsByClient(clientId: string) {
    return this.prisma.clientJob.findMany({
      where: { clientId, deletedAt: null },
      include: { incomeTransaction: { include: { account: true } }, outsourcedTransaction: { include: { account: true } } },
      orderBy: { serviceDate: "desc" },
    });
  }

  allJobs() {
    return this.prisma.clientJob.findMany({
      where: { deletedAt: null },
      include: {
        client: true,
        incomeTransaction: { include: { account: true } },
        outsourcedTransaction: { include: { account: true } },
      },
      orderBy: { serviceDate: "desc" },
    });
  }

  findJobById(id: string) {
    return this.prisma.clientJob.findFirst({
      where: { id, deletedAt: null },
      include: { incomeTransaction: true, outsourcedTransaction: true },
    });
  }

  createJob(data: {
    clientId: string;
    type: string;
    description: string;
    serviceDate: Date;
    incomeTransactionId: string;
    isOutsourced: boolean;
    outsourcedTo?: string;
    outsourcedTransactionId?: string;
  }) {
    return this.prisma.clientJob.create({
      data: data as any,
      include: { incomeTransaction: { include: { account: true } }, outsourcedTransaction: { include: { account: true } } },
    });
  }

  softDeleteJob(id: string) {
    return this.prisma.clientJob.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async ensureCategory(kind: "income" | "outsourced") {
    const preset = DEFAULT_CATEGORIES[kind];
    const existing = await this.prisma.category.findFirst({
      where: { name: preset.name, type: preset.type, deletedAt: null },
    });
    if (existing) return existing;
    return this.prisma.category.create({ data: preset });
  }
}
