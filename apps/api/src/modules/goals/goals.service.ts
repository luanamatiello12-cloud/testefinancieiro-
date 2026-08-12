import { Injectable, NotFoundException } from "@nestjs/common";
import { GoalsRepository } from "./goals.repository";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";

@Injectable()
export class GoalsService {
  constructor(private readonly repository: GoalsRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const goal = await this.repository.findById(id);
    if (!goal) throw new NotFoundException("Meta não encontrada");
    return goal;
  }

  create(data: CreateGoalDto) {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateGoalDto) {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.softDelete(id);
  }

  async contribute(id: string, amount: number) {
    await this.findById(id);
    return this.repository.contribute(id, amount);
  }
}
