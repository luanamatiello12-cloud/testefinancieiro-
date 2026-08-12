import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ChatMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRecent(limit = 30) {
    return this.prisma.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  create(role: "user" | "assistant", content: string) {
    return this.prisma.chatMessage.create({ data: { role, content } });
  }

  clear() {
    return this.prisma.chatMessage.deleteMany();
  }
}
