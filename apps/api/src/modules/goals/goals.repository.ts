import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";

@Injectable()
export class GoalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.goal.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  }

  findById(id: string) {
    return this.prisma.goal.findFirst({ where: { id, deletedAt: null } });
  }

  create(data: CreateGoalDto) {
    return this.prisma.goal.create({
      data: { ...data, deadline: data.deadline ? new Date(data.deadline) : undefined },
    });
  }

  update(id: string, data: UpdateGoalDto) {
    return this.prisma.goal.update({
      where: { id },
      data: { ...data, deadline: data.deadline ? new Date(data.deadline) : undefined },
    });
  }

  softDelete(id: string) {
    return this.prisma.goal.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  contribute(id: string, amount: number) {
    return this.prisma.goal.update({
      where: { id },
      data: { currentValue: { increment: amount } },
    });
  }
}
