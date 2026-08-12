import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { QueryTransactionDto } from "./dto/query-transaction.dto";
import { STORAGE_PROVIDER, IStorageProvider } from "../../common/storage/storage.provider";

@Controller("transactions")
export class TransactionsController {
  constructor(
    private readonly service: TransactionsService,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  @Get()
  findAll(@Query() query: QueryTransactionDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTransactionDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Patch(":id/pay")
  setPaid(@Param("id") id: string, @Body("isPaid") isPaid: boolean) {
    return this.service.setPaid(id, isPaid ?? true);
  }

  @Post(":id/attachments")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  async addAttachment(@Param("id") id: string, @UploadedFile() file: Express.Multer.File) {
    const stored = await this.storage.save(file);
    return this.service.addAttachment(id, stored);
  }
}
