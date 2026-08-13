import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PushRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(data: { endpoint: string; p256dh: string; auth: string }) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: data,
      update: data,
    });
  }

  removeByEndpoint(endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  findAll() {
    return this.prisma.pushSubscription.findMany();
  }
}
