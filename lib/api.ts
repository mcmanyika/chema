import { getClientAuth } from "@/lib/firebase/client";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const user = getClientAuth().currentUser;
  if (user) {
    headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  }

  const response = await fetch(path, { ...options, headers });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
  } & T;

  if (!response.ok) {
    throw new ApiError(payload.error ?? payload.message ?? "Request failed", response.status);
  }

  return payload;
}
