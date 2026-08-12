import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { GoalsService } from "./goals.service";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";

@Controller("goals")
export class GoalsController {
  constructor(private readonly service: GoalsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateGoalDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGoalDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Patch(":id/contribute")
  contribute(@Param("id") id: string, @Body("amount") amount: number) {
    return this.service.contribute(id, amount);
  }
}
