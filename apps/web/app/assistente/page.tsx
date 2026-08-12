"use client";

import * as React from "react";
import useSWR from "swr";
import Link from "next/link";
import { Send, Sparkles, Settings2 } from "lucide-react";
import { fetcher, api } from "@/lib/api/client";
import { revalidateFinancialData } from "@/lib/api/revalidate";
import { AppSettings, ChatMessage } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

export default function AssistentePage() {
  const { data: settings } = useSWR<AppSettings>("/settings", fetcher);
  const { data: history } = useSWR<ChatMessage[]>("/assistant/messages", fetcher);

  const [messages, setMessages] = React.useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    if (history && !hydrated.current) {
      setMessages(history.map((m) => ({ role: m.role, content: m.content })));
      hydrated.current = true;
    }
  }, [history]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const res = await api.post<{ reply: string }>("/assistant/chat", { message: text });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      await revalidateFinancialData();
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Algo deu errado ao processar sua mensagem. Tente de novo." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Sparkles className="h-5 w-5 text-primary" /> Assistente
        </h1>
        <p className="text-sm text-muted-foreground">Conte o que aconteceu e eu lanço pra você</p>
      </div>

      {settings && !settings.hasGeminiKey && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm">
              Configure sua chave da API do Gemini para o assistente conseguir lançar coisas de verdade.
            </p>
            <Link href="/configuracoes">
              <Button size="sm" variant="outline">
                <Settings2 className="h-3.5 w-3.5" /> Configurar
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Sparkles className="h-8 w-8 opacity-30" />
              <p>Diga algo como &ldquo;gastei 45 no mercado hoje&rdquo;</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-secondary text-secondary-foreground",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreva uma mensagem..."
            className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
