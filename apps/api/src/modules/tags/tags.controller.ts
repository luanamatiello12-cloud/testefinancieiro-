import { Controller, Get } from "@nestjs/common";
import { TagsRepository } from "./tags.repository";

@Controller("tags")
export class TagsController {
  constructor(private readonly repository: TagsRepository) {}

  @Get()
  findAll() {
    return this.repository.findAll();
  }
}
