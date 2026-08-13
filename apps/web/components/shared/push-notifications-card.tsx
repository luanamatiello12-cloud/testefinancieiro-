"use client";

import * as React from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";

type Status = "unsupported" | "checking" | "denied" | "subscribed" | "unsubscribed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushNotificationsCard() {
  const [status, setStatus] = React.useState<Status>("checking");
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    setStatus(sub ? "subscribed" : "unsubscribed");
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function subscribe() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const { publicKey } = await api.get<{ publicKey: string | null }>("/push/vapid-public-key");
      if (!publicKey) throw new Error("Servidor sem chave VAPID configurada");

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      await api.post("/push/subscribe", { endpoint: json.endpoint, keys: json.keys });
      setStatus("subscribed");
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await api.post("/push/unsubscribe", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    try {
      await api.post("/push/test");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-4 w-4" /> Notificações push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {status === "subscribed" && <Badge variant="success">Ativadas neste dispositivo</Badge>}
          {status === "unsubscribed" && <Badge variant="outline">Desativadas</Badge>}
          {status === "denied" && <Badge variant="destructive">Bloqueadas no navegador</Badge>}
          {status === "unsupported" && <Badge variant="outline">Não suportado neste navegador</Badge>}
          {status === "checking" && <Badge variant="outline">Verificando...</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          Receba avisos de contas a vencer, atrasadas, saldo negativo e outros alertas direto no seu celular ou
          computador, mesmo com o app fechado. Funciona melhor se você adicionar o site à tela inicial do celular.
        </p>
        {status === "denied" && (
          <p className="text-xs text-destructive">
            As notificações foram bloqueadas para este site. Habilite manualmente nas permissões do navegador para
            ativar.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {status === "subscribed" ? (
            <>
              <Button variant="outline" size="sm" onClick={unsubscribe} disabled={busy}>
                <BellOff className="h-3.5 w-3.5" /> Desativar
              </Button>
              <Button variant="outline" size="sm" onClick={sendTest} disabled={busy}>
                Enviar teste
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={subscribe}
              disabled={busy || status === "unsupported" || status === "denied" || status === "checking"}
            >
              <Bell className="h-3.5 w-3.5" /> Ativar notificações
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
