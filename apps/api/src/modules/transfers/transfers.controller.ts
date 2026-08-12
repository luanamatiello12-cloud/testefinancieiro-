import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { TransfersService } from "./transfers.service";
import { CreateTransferDto } from "./dto/create-transfer.dto";

@Controller("transfers")
export class TransfersController {
  constructor(private readonly service: TransfersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateTransferDto) {
    return this.service.create(dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
