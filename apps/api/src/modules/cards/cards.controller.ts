import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CardsService } from "./cards.service";
import { CreateCardDto } from "./dto/create-card.dto";
import { UpdateCardDto } from "./dto/update-card.dto";
import { CreateCardPurchaseDto } from "./dto/create-card-purchase.dto";

@Controller("cards")
export class CardsController {
  constructor(private readonly service: CardsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Get(":id/limit")
  limit(@Param("id") id: string) {
    return this.service.availableLimit(id);
  }

  @Post()
  create(@Body() dto: CreateCardDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCardDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Post(":id/purchases")
  addPurchase(@Param("id") id: string, @Body() dto: CreateCardPurchaseDto) {
    return this.service.addPurchase(id, dto);
  }

  @Delete("purchases/:purchaseId")
  removePurchase(@Param("purchaseId") purchaseId: string) {
    return this.service.removePurchase(purchaseId);
  }

  @Get(":id/invoice")
  invoice(@Param("id") id: string, @Query("month") month?: string) {
    return this.service.invoice(id, month);
  }

  @Patch(":id/invoice/:month/pay")
  setInvoicePaid(
    @Param("id") id: string,
    @Param("month") month: string,
    @Body("paid") paid: boolean,
  ) {
    return this.service.setInvoicePaid(id, month, paid ?? true);
  }
}
