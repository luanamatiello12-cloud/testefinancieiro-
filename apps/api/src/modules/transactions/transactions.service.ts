import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@sistema-financeiro/database";
import { randomUUID } from "crypto";
import { TransactionsRepository } from "./transactions.repository";
import { AccountsRepository } from "../accounts/accounts.repository";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { QueryTransactionDto } from "./dto/query-transaction.dto";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repository: TransactionsRepository,
    private readonly accountsRepository: AccountsRepository,
  ) {}

  async findAll(query: QueryTransactionDto) {
    const where: Prisma.TransactionWhereInput = { deletedAt: null };

    if (query.type) where.type = query.type;
    if (query.accountId) where.accountId = query.accountId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isPaid !== undefined) where.isPaid = query.isPaid === "true";
    if (query.from || query.to) {
      where.date = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }
    if (query.search) {
      where.OR = [
        { description: { contains: query.search } },
        { note: { contains: query.search } },
      ];
    }

    return this.repository.findAll(where);
  }

  async findById(id: string) {
    const transaction = await this.repository.findById(id);
    if (!transaction) throw new NotFoundException("Lançamento não encontrado");
    return transaction;
  }

  async create(dto: CreateTransactionDto) {
    const installmentTotal = dto.installmentTotal && dto.installmentTotal > 1 ? dto.installmentTotal : undefined;

    if (!installmentTotal) {
      const created = await this.repository.create(this.toPrismaCreate(dto));
      if (dto.isPaid) {
        await this.applyBalanceEffect(created.accountId, created.type, created.value);
      }
      return created;
    }

    const installmentGroupId = randomUUID();
    const installmentValue = Math.round((dto.value / installmentTotal) * 100) / 100;
    const baseDate = new Date(dto.dueDate ?? dto.date);

    const installments: Prisma.TransactionCreateManyInput[] = Array.from(
      { length: installmentTotal },
      (_, i) => {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        return {
          value: installmentValue,
          type: dto.type,
          date: new Date(dto.date),
          dueDate,
          description: `${dto.description} (${i + 1}/${installmentTotal})`,
          note: dto.note,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          costCenterId: dto.costCenterId,
          installmentGroupId,
          installmentNumber: i + 1,
          installmentTotal,
          isPaid: false,
        };
      },
    );

    await this.repository.createMany(installments);
    return this.repository.findAll({ installmentGroupId });
  }

  async update(id: string, dto: UpdateTransactionDto) {
    await this.findById(id);
    return this.repository.update(id, this.toPrismaCreate(dto as CreateTransactionDto, true));
  }

  async remove(id: string) {
    const transaction = await this.findById(id);
    if (transaction.isPaid) {
      const delta = transaction.type === "INCOME" ? -transaction.value : transaction.value;
      await this.accountsRepository.adjustBalance(transaction.accountId, delta);
    }
    return this.repository.softDelete(id);
  }

  async setPaid(id: string, isPaid: boolean) {
    const transaction = await this.findById(id);
    if (transaction.isPaid === isPaid) return transaction;

    const updated = await this.repository.update(id, {
      isPaid,
      paymentDate: isPaid ? new Date() : null,
    });

    const sign = transaction.type === "INCOME" ? 1 : -1;
    const delta = isPaid ? sign * transaction.value : -sign * transaction.value;
    await this.accountsRepository.adjustBalance(transaction.accountId, delta);

    return updated;
  }

  async addAttachment(transactionId: string, file: { url: string; filename: string; mimetype: string }) {
    await this.findById(transactionId);
    return this.repository.addAttachment(transactionId, file);
  }

  private async applyBalanceEffect(accountId: string, type: "INCOME" | "EXPENSE", value: number) {
    const delta = type === "INCOME" ? value : -value;
    await this.accountsRepository.adjustBalance(accountId, delta);
  }

  private toPrismaCreate(dto: CreateTransactionDto, partial = false): any {
    if (!partial && !dto.accountId) throw new BadRequestException("accountId é obrigatório");

    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    if (dto.paymentDate) data.paymentDate = new Date(dto.paymentDate);

    if (!partial) {
      const { accountId, categoryId, costCenterId, ...rest } = data;
      return {
        ...rest,
        account: { connect: { id: accountId } },
        category: { connect: { id: categoryId } },
        ...(costCenterId ? { costCenter: { connect: { id: costCenterId } } } : {}),
      };
    }

    return data;
  }
}
