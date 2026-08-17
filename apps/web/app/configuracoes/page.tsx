"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, Sparkles, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetcher, api } from "@/lib/api/client";
import { AppSettings } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { PushNotificationsCard } from "@/components/shared/push-notifications-card";

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Laptop },
];

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const { data: settings } = useSWR<AppSettings>("/settings", fetcher);
  const [apiKey, setApiKey] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  async function saveApiKey(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      await api.patch("/settings", { geminiApiKey: apiKey.trim() });
      await mutate("/settings");
      setApiKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Preferências do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = mounted && theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border py-4 text-sm font-medium transition-colors",
                  active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                <Icon className="h-5 w-5" />
                {opt.label}
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Assistente de IA (Gemini)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            {settings?.hasGeminiKey ? (
              <Badge variant="success">Configurado · {settings.geminiKeyPreview}</Badge>
            ) : (
              <Badge variant="outline">Não configurado</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Cole sua chave da API do Gemini (Google AI Studio) para conversar com o assistente e lançar
            receitas/gastos por texto natural, em vez de preencher formulários.
          </p>
          <form onSubmit={saveApiKey} className="flex gap-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings?.hasGeminiKey ? "Colar uma nova chave..." : "Cole sua chave da API aqui"}
              className="flex-1"
            />
            <Button type="submit" disabled={saving || !apiKey.trim()}>
              {saved ? <Check className="h-4 w-4" /> : saving ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PushNotificationsCard />

      <Card>
        <CardHeader>
          <CardTitle>Moeda</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Real brasileiro (R$)</p>
          <p className="mt-1 text-xs text-muted-foreground">Suporte a múltiplas moedas chega em uma próxima etapa.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup, exportação e importação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Exportar/importar dados e relatórios em PDF/Excel serão adicionados em uma próxima etapa do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
