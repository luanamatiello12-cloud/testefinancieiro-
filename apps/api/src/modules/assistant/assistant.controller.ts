import { Body, Controller, Delete, Get, Post } from "@nestjs/common";
import { AssistantService } from "./assistant.service";
import { SendMessageDto } from "./dto/send-message.dto";

@Controller("assistant")
export class AssistantController {
  constructor(private readonly service: AssistantService) {}

  @Get("messages")
  history() {
    return this.service.history();
  }

  @Delete("messages")
  clear() {
    return this.service.clearHistory();
  }

  @Post("chat")
  chat(@Body() dto: SendMessageDto) {
    return this.service.chat(dto.message);
  }
}
