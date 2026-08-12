import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { CreateClientJobDto } from "./dto/create-client-job.dto";

@Controller("clients")
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get("jobs")
  allJobs() {
    return this.service.allJobs();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Get(":id/jobs")
  jobs(@Param("id") id: string) {
    return this.service.jobs(id);
  }

  @Post(":id/jobs")
  addJob(@Param("id") id: string, @Body() dto: CreateClientJobDto) {
    return this.service.addJob(id, dto);
  }

  @Delete("jobs/:jobId")
  removeJob(@Param("jobId") jobId: string) {
    return this.service.removeJob(jobId);
  }
}
