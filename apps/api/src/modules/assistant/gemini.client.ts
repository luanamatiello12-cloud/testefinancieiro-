import { Injectable, Logger } from "@nestjs/common";

export interface ExtractedIntent {
  understood: boolean;
  action: "create_income" | "create_expense" | "create_event" | "none";
  value?: number;
  description?: string;
  accountName?: string;
  categoryName?: string;
  date?: string;
  dueDate?: string;
  isPaid?: boolean;
  installments?: number;
  replyMessage: string;
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    understood: { type: "BOOLEAN" },
    action: { type: "STRING", enum: ["create_income", "create_expense", "create_event", "none"] },
    value: { type: "NUMBER" },
    description: { type: "STRING" },
    accountName: { type: "STRING" },
    categoryName: { type: "STRING" },
    date: { type: "STRING", description: "YYYY-MM-DD" },
    dueDate: { type: "STRING", description: "YYYY-MM-DD, only for expenses with a future due date" },
    isPaid: { type: "BOOLEAN" },
    installments: { type: "INTEGER" },
    replyMessage: { type: "STRING", description: "Short, friendly confirmation in Brazilian Portuguese" },
  },
  required: ["understood", "action", "replyMessage"],
};

/**
 * Thin wrapper around the Gemini REST API (generateContent) using structured
 * JSON output. Untested against a live key — verify the model name and
 * response shape once a real GEMINI key is configured.
 */
@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);

  async extractIntent(params: {
    apiKey: string;
    model: string;
    systemInstruction: string;
    userMessage: string;
  }): Promise<ExtractedIntent> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: params.userMessage }] }],
        systemInstruction: { parts: [{ text: params.systemInstruction }] },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      this.logger.error(`Gemini API error ${res.status}: ${body}`);
      throw new Error(`Falha ao chamar a API do Gemini (${res.status})`);
    }

    const data = (await res.json()) as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Resposta do Gemini veio vazia");
    }

    return JSON.parse(text) as ExtractedIntent;
  }

  async listModels(apiKey: string): Promise<string[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao listar modelos (${res.status})`);
    const data = (await res.json()) as any;
    return (data.models ?? [])
      .filter((m: any) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
      .map((m: any) => m.name.replace("models/", ""));
  }
}
