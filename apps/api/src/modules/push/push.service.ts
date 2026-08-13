import { Injectable, Logger } from "@nestjs/common";
import * as webpush from "web-push";
import { PushRepository } from "./push.repository";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private configured = false;

  constructor(private readonly repository: PushRepository) {}

  private ensureConfigured() {
    if (this.configured) return;
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT ?? "mailto:push@sistema-financeiro.local";
    if (!publicKey || !privateKey) {
      throw new Error("VAPID keys não configuradas no servidor");
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.configured = true;
  }

  getPublicKey() {
    return process.env.VAPID_PUBLIC_KEY ?? null;
  }

  subscribe(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return this.repository.upsert({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth });
  }

  unsubscribe(endpoint: string) {
    return this.repository.removeByEndpoint(endpoint);
  }

  async sendToAll(payload: PushPayload) {
    this.ensureConfigured();
    const subs = await this.repository.findAll();
    if (subs.length === 0) return { sent: 0, total: 0 };

    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        ),
      ),
    );

    let sent = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        sent++;
      } else {
        const err = r.reason as { statusCode?: number };
        this.logger.warn(`Push falhou para inscrição ${subs[i].id}: ${err?.statusCode ?? "erro desconhecido"}`);
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await this.repository.removeByEndpoint(subs[i].endpoint);
        }
      }
    }
    return { sent, total: subs.length };
  }
}
