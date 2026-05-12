import { resolveCredentials, stripGerritPrefix } from "../utils/parsing.js";

export class GerritClient {
  private baseUrl: string;
  private authHeader: string;

  constructor() {
    const creds = resolveCredentials();
    this.baseUrl = creds.url.replace(/\/$/, "");
    const encoded = Buffer.from(
      `${creds.username}:${creds.password}`,
    ).toString("base64");
    this.authHeader = `Basic ${encoded}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}/a${path}`;
    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      Accept: "application/json",
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Gerrit API error (${response.status}): ${text.slice(0, 500)}`,
      );
    }

    const text = await response.text();
    const json = stripGerritPrefix(text);
    return JSON.parse(json) as T;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async delete(path: string): Promise<void> {
    await this.request("DELETE", path);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
