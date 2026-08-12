import { Injectable, NotFoundException } from "@nestjs/common";
import { ClientsRepository } from "./clients.repository";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { CreateClientJobDto } from "./dto/create-client-job.dto";
import { TransactionsService } from "../transactions/transactions.service";

@Injectable()
export class ClientsService {
  constructor(
    private readonly repository: ClientsRepository,
    private readonly transactionsService: TransactionsService,
  ) {}

  findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const client = await this.repository.findById(id);
    if (!client) throw new NotFoundException("Cliente não encontrado");
    return client;
  }

  create(data: CreateClientDto) {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateClientDto) {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.softDelete(id);
  }

  async jobs(clientId: string) {
    await this.findById(clientId);
    return this.repository.jobsByClient(clientId);
  }

  allJobs() {
    return this.repository.allJobs();
  }

  async addJob(clientId: string, dto: CreateClientJobDto) {
    await this.findById(clientId);

    const incomeCategory = await this.repository.ensureCategory("income");
    const incomeTransactionResult = await this.transactionsService.create({
      value: dto.value,
      type: "INCOME",
      date: dto.serviceDate,
      dueDate: dto.dueDate,
      description: `${describeType(dto.type)} — ${dto.description}`,
      accountId: dto.accountId,
      categoryId: incomeCategory.id,
      isPaid: false,
    } as any);
    const incomeTransactionId = singleTransactionId(incomeTransactionResult);

    if (dto.isPaid) {
      await this.transactionsService.setPaid(incomeTransactionId, true);
    }

    let outsourcedTransactionId: string | undefined;
    if (dto.isOutsourced) {
      const outsourcedCategory = await this.repository.ensureCategory("outsourced");
      const outsourcedTransactionResult = await this.transactionsService.create({
        value: dto.outsourcedValue!,
        type: "EXPENSE",
        date: dto.serviceDate,
        dueDate: dto.outsourcedDueDate,
        description: `Terceiro (${dto.outsourcedTo}) — ${dto.description}`,
        accountId: dto.outsourcedAccountId!,
        categoryId: outsourcedCategory.id,
        isPaid: false,
      } as any);
      outsourcedTransactionId = singleTransactionId(outsourcedTransactionResult);

      if (dto.outsourcedIsPaid) {
        await this.transactionsService.setPaid(outsourcedTransactionId, true);
      }
    }

    return this.repository.createJob({
      clientId,
      type: dto.type,
      description: dto.description,
      serviceDate: new Date(dto.serviceDate),
      incomeTransactionId,
      isOutsourced: Boolean(dto.isOutsourced),
      outsourcedTo: dto.isOutsourced ? dto.outsourcedTo : undefined,
      outsourcedTransactionId,
    });
  }

  async removeJob(jobId: string) {
    const job = await this.repository.findJobById(jobId);
    if (!job) throw new NotFoundException("Trabalho não encontrado");

    await this.transactionsService.remove(job.incomeTransactionId);
    if (job.outsourcedTransactionId) {
      await this.transactionsService.remove(job.outsourcedTransactionId);
    }
    return this.repository.softDeleteJob(jobId);
  }
}

function describeType(type: string) {
  const labels: Record<string, string> = { PHOTO: "Foto", VIDEO: "Vídeo", CAPTURE: "Captação" };
  return labels[type] ?? type;
}

function singleTransactionId(result: { id: string } | { id: string }[]): string {
  return Array.isArray(result) ? result[0].id : result.id;
}
