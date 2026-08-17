import { Injectable, Logger } from "@nestjs/common";

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface FunctionCall {
  name: string;
  args: Record<string, unknown>;
}

type GeminiPart =
  | { text: string }
  | { functionCall: FunctionCall }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

export interface GeminiTurn {
  role: "user" | "model" | "function";
  parts: GeminiPart[];
}

export interface GeminiChatResult {
  functionCalls: FunctionCall[];
  text: string;
  modelTurn: GeminiTurn;
}

@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);

  async chat(params: {
    apiKey: string;
    model: string;
    systemInstruction: string;
    contents: GeminiTurn[];
    tools: FunctionDeclaration[];
  }): Promise<GeminiChatResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: params.contents,
        systemInstruction: { parts: [{ text: params.systemInstruction }] },
        tools: [{ functionDeclarations: params.tools }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      this.logger.error(`Gemini API error ${res.status}: ${body}`);
      throw new Error(`Falha ao chamar a API do Gemini (${res.status})`);
    }

    const data = (await res.json()) as any;
    const candidate = data.candidates?.[0];
    const parts: any[] = candidate?.content?.parts ?? [];
    if (parts.length === 0) {
      throw new Error("Resposta do Gemini veio vazia");
    }

    const functionCalls: FunctionCall[] = parts
      .filter((p) => p.functionCall)
      .map((p) => p.functionCall as FunctionCall);
    const text = parts
      .filter((p) => typeof p.text === "string")
      .map((p) => p.text)
      .join("\n");

    return {
      functionCalls,
      text,
      modelTurn: { role: "model", parts },
    };
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
