import { Client, ConnectConfig } from "ssh2";
import {
  resolveCredentials,
  resolveSshConfig,
  resolveTransport,
  stripGerritPrefix,
  type Transport,
} from "../utils/parsing.js";

export class GerritClient {
  private transport: Transport;
  private baseUrl: string;
  private authHeader: string;
  private sshClient: Client | null = null;
  private sshConfig: ConnectConfig | null = null;
  private sshReady: Promise<void> | null = null;

  constructor() {
    this.transport = resolveTransport();

    if (this.transport === "http") {
      const creds = resolveCredentials();
      this.baseUrl = creds.url.replace(/\/$/, "");
      const encoded = Buffer.from(
        `${creds.username}:${creds.password}`,
      ).toString("base64");
      this.authHeader = `Basic ${encoded}`;
    } else {
      const sshCfg = resolveSshConfig();
      this.baseUrl = `ssh://${sshCfg.username}@${sshCfg.host}:${sshCfg.port}`;
      this.authHeader = "";
      this.sshConfig = {
        host: sshCfg.host,
        port: sshCfg.port,
        username: sshCfg.username,
        privateKey: sshCfg.privateKey,
        passphrase: sshCfg.passphrase,
        readyTimeout: 30_000,
      };
      this.sshClient = new Client();
      this.sshReady = new Promise((resolve, reject) => {
        this.sshClient!.on("ready", resolve);
        this.sshClient!.on("error", reject);
        this.sshClient!.connect(this.sshConfig!);
      });
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    if (this.transport === "ssh") {
      return this.sshRequest<T>(method, path, body);
    }
    return this.httpRequest<T>(method, path, body);
  }

  private async httpRequest<T>(
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

  private async sshRequest<T>(
    _method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    if (!this.sshClient || !this.sshReady) {
      throw new Error("SSH client not initialized");
    }

    // Ensure connection is ready before executing commands
    await this.sshReady;

    const args = this.buildSshArgs(path, body);
    const output = await this.execSshCommand("gerrit", args);
    const json = stripGerritPrefix(output);
    try {
      return JSON.parse(json) as T;
    } catch {
      return output as unknown as T;
    }
  }

  private buildSshArgs(path: string, body?: unknown): string[] {
    const parts = path.replace(/^\//, "").split("/");
    const args: string[] = [];

    if (path.startsWith("/changes/")) {
      const rest = path.slice("/changes/".length);
      const segs = rest.split("/");
      const changeId = segs[0];

      if (rest.includes("/review")) {
        const rev = segs[1] === "revisions" ? segs[2] : "current";
        args.push("review", changeId, "--revision", rev);
        if (body) {
          const b = body as Record<string, unknown>;
          if (b.message) args.push("--message", String(b.message));
          if (b.labels) {
            const labels = b.labels as Record<string, number>;
            for (const [k, v] of Object.entries(labels)) {
              args.push("--label", `${k}=${v}`);
            }
          }
          if (b.comments) {
            const comments = b.comments as Record<string, { message: string; line?: number; path?: string }[]>;
            for (const [filePath, fileComments] of Object.entries(comments)) {
              for (const c of fileComments) {
                let commentText = c.message;
                if (c.line !== undefined) {
                  commentText = `Line ${c.line}: ${commentText}`;
                }
                args.push("--comment", `${filePath}: ${commentText}`);
              }
            }
          }
          if (b.ready === true) args.push("--ready");
          if (b.work_in_progress === true) args.push("--work-in-progress");
          if (b.tag) args.push("--tag", String(b.tag));
        }
      } else if (rest.includes("/abandon")) {
        args.push("abandon", changeId);
        if (body && (body as Record<string, unknown>).message) {
          args.push("--message", String((body as Record<string, unknown>).message));
        }
      } else if (rest.includes("/restore")) {
        args.push("restore", changeId);
      } else if (rest.includes("/submit")) {
        args.push("submit", changeId);
      } else if (rest.includes("/reviewers")) {
        if (body) {
          const b = body as Record<string, unknown>;
          args.push("set-reviewers", changeId);
          if (b.reviewer) {
            args.push("--add", String(b.reviewer));
          }
        } else {
          args.push("query", changeId, "--current-patch-set", "--detailed-accounts", "--format=JSON");
        }
      } else if (rest.includes("/files")) {
        const rev = segs[1] === "revisions" ? segs[2] : "current";
        args.push("query", changeId, "--current-patch-set", "--files", "--format=JSON");
      } else if (rest.includes("/comments")) {
        args.push("query", changeId, "--current-patch-set", "--comments", "--format=JSON");
      } else if (rest.includes("/commit")) {
        const rev = segs[1] === "revisions" ? segs[2] : "current";
        args.push("query", changeId, "--current-patch-set", "--commit-message", "--format=JSON");
      } else if (rest.includes("/detail")) {
        args.push("query", changeId, "--current-patch-set", "--current-commit", "--detailed-accounts", "--format=JSON");
      } else {
        args.push("query", changeId, "--current-patch-set", "--format=JSON");
      }
    } else if (path.startsWith("/changes/?")) {
      const params = new URLSearchParams(path.slice("/changes/?".length));
      const query = params.get("q") || "status:open";
      const limit = params.get("n") || "25";
      const start = params.get("S") || "0";
      const opts = params.getAll("o");
      args.push("query", query, `--limit=${limit}`, `--start=${start}`, "--format=JSON");
      for (const o of opts) {
        args.push(`--${o.toLowerCase().replace(/_/g, "-")}`);
      }
    } else if (path.startsWith("/accounts/")) {
      throw new Error("Account operations are not supported over SSH transport");
    } else if (path.startsWith("/projects/")) {
      if (path === "/projects/" || path.startsWith("/projects/?")) {
        const params = path.includes("?") ? new URLSearchParams(path.split("?")[1]) : new URLSearchParams();
        const prefix = params.get("p") || "";
        const limit = params.get("n") ? parseInt(params.get("n")!, 10) : undefined;
        args.push("ls-projects");
        if (prefix) args.push(prefix);
        if (limit) args.push(`--limit=${limit}`);
      } else {
        throw new Error("Single project lookup is not supported over SSH transport");
      }
    } else if (path === "/config/server/version") {
      args.push("version");
    } else if (path === "/config/server/info") {
      throw new Error("Server info is not available over SSH transport");
    } else {
      args.push(...parts);
    }

    return args;
  }

  private async execSshCommand(cmd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.sshClient || !this.sshReady) {
        reject(new Error("SSH client not initialized"));
        return;
      }

      // Ensure connection is ready
      this.sshReady.then(() => {
        const fullCmd = [cmd, ...args].join(" ");
        this.sshClient!.exec(fullCmd, (err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          let stdout = "";
          let stderr = "";

          stream.on("data", (data: Buffer) => {
            stdout += data.toString();
          });

          stream.stderr.on("data", (data: Buffer) => {
            stderr += data.toString();
          });

          stream.on("close", (code: number) => {
            if (code !== 0) {
              reject(new Error(`SSH command failed (${code}): ${stderr}`));
            } else {
              resolve(stdout);
            }
          });

          stream.on("error", reject);
        });
      }).catch(reject);
    });
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

  getTransport(): Transport {
    return this.transport;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async getVersion(): Promise<string> {
    if (this.transport === "ssh") {
      return this.execSshCommand("gerrit", ["version"]);
    }
    return this.get<string>("/config/server/version");
  }

  async getAvailableCommands(): Promise<Set<string>> {
    if (this.transport === "ssh") {
      try {
        const output = await this.execSshCommand("gerrit", ["help"]);
        const commands = new Set<string>();
        for (const line of output.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("'gerrit") && !trimmed.startsWith("--")) {
            const cmd = trimmed.split(/\s+/)[0];
            if (cmd && /^[a-z]/.test(cmd)) {
              commands.add(cmd);
            }
          }
        }
        return commands;
      } catch {
        // Older Gerrit versions (e.g., 2.15.x) may not support 'gerrit help'
        return new Set<string>([
          "query", "review", "abandon", "restore", "submit",
          "set-reviewers", "ls-projects", "version",
        ]);
      }
    }
    const info = await this.get<Record<string, unknown>>("/config/server/info");
    const commands = new Set<string>([
      "query", "review", "abandon", "restore", "submit",
      "set-reviewers", "ls-projects", "version",
    ]);
    if ((info as Record<string, unknown>)["accounts"]) {
      commands.add("accounts");
    }
    return commands;
  }

  isCommandAvailable(command: string, _availableCommands: Set<string>): boolean {
    return _availableCommands.has(command);
  }

  close(): void {
    if (this.sshClient) {
      this.sshClient.end();
    }
  }
}
