import { Module } from "@nestjs/common";
import { TagsController } from "./tags.controller";
import { TagsRepository } from "./tags.repository";

@Module({
  controllers: [TagsController],
  providers: [TagsRepository],
  exports: [TagsRepository],
})
export class TagsModule {}
