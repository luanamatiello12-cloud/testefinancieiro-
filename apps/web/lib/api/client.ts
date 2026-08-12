const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message ?? "Erro na requisição");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: async <T>(path: string, file: File): Promise<T> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}${path}`, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Falha ao enviar arquivo");
    return res.json();
  },
};

export const fetcher = (path: string) => api.get(path);
export { API_URL };
