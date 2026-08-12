import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { TransfersRepository } from "./transfers.repository";
import { CreateTransferDto } from "./dto/create-transfer.dto";

@Injectable()
export class TransfersService {
  constructor(private readonly repository: TransfersRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async create(dto: CreateTransferDto) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException("Conta de origem e destino devem ser diferentes");
    }
    return this.repository.createWithBalanceUpdate({
      fromAccountId: dto.fromAccountId,
      toAccountId: dto.toAccountId,
      value: dto.value,
      date: new Date(dto.date),
      note: dto.note,
    });
  }

  async remove(id: string) {
    const transfer = await this.repository.findById(id);
    if (!transfer) throw new NotFoundException("Transferência não encontrada");
    return this.repository.removeWithBalanceRevert(id);
  }
}
