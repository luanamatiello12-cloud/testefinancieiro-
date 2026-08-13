import { Body, Controller, Get, Post } from "@nestjs/common";
import { PushService } from "./push.service";
import { SubscribeDto } from "./dto/subscribe.dto";

@Controller("push")
export class PushController {
  constructor(private readonly service: PushService) {}

  @Get("vapid-public-key")
  vapidPublicKey() {
    return { publicKey: this.service.getPublicKey() };
  }

  @Post("subscribe")
  subscribe(@Body() dto: SubscribeDto) {
    return this.service.subscribe(dto);
  }

  @Post("unsubscribe")
  unsubscribe(@Body("endpoint") endpoint: string) {
    return this.service.unsubscribe(endpoint);
  }

  @Post("test")
  test() {
    return this.service.sendToAll({
      title: "Sistema Financeiro",
      body: "Notificações push estão funcionando! 🎉",
    });
  }
}
