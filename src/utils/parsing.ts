import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type Transport = "http" | "ssh";

export function stripGerritPrefix(text: string): string {
  if (text.startsWith(")]}'")) {
    return text.slice(4);
  }
  return text;
}

export interface NetrcEntry {
  login: string;
  password: string;
}

export interface NetrcData {
  [machine: string]: NetrcEntry;
}

export function parseNetrc(): NetrcData {
  const netrcPath = join(homedir(), ".netrc");

  if (!existsSync(netrcPath)) {
    return {};
  }

  const content = readFileSync(netrcPath, "utf-8");
  const lines = content.split("\n").map((line) => line.trim());
  const result: NetrcData = {};
  let currentMachine: string | null = null;
  let currentEntry: NetrcEntry = { login: "", password: "" };

  for (const line of lines) {
    if (line === "" || line.startsWith("#")) {
      continue;
    }

    const tokens = line.split(/\s+/);
    if (tokens.length < 2) continue;

    const keyword = tokens[0].toLowerCase();
    const value = tokens.slice(1).join(" ");

    switch (keyword) {
      case "machine":
        if (currentMachine && currentEntry.login) {
          result[currentMachine] = { ...currentEntry };
        }
        currentMachine = value;
        currentEntry = { login: "", password: "" };
        break;
      case "login":
        currentEntry.login = value;
        break;
      case "password":
        currentEntry.password = value;
        break;
      case "default":
        if (currentMachine) {
          result[currentMachine] = { ...currentEntry };
        }
        currentMachine = "default";
        currentEntry = { login: "", password: "" };
        break;
    }
  }

  if (currentMachine && currentEntry.login) {
    result[currentMachine] = currentEntry;
  }

  return result;
}

export function resolveTransport(): Transport {
  const t = (process.env.GERRIT_TRANSPORT || "http").toLowerCase();
  if (t !== "http" && t !== "ssh") {
    throw new Error(
      `GERRIT_TRANSPORT must be 'http' or 'ssh', got '${t}'.`
    );
  }
  return t as Transport;
}

export interface SshConfig {
  host: string;
  port: number;
  username: string;
  privateKey: string;
  passphrase?: string;
}

export function parseSshUrl(url: string): {
  host: string;
  port: number;
  username?: string;
} {
  if (url.startsWith("ssh://")) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 29418,
      username: parsed.username || undefined,
    };
  }

  const scpMatch = url.match(/^(?:([^@]+)@)?([^:]+)(?::(\d+))?$/);
  if (scpMatch) {
    return {
      host: scpMatch[2],
      port: scpMatch[3] ? parseInt(scpMatch[3], 10) : 29418,
      username: scpMatch[1] || undefined,
    };
  }

  throw new Error(
    `Cannot parse SSH URL: ${url}. Use ssh://user@host:29418 or user@host[:port].`
  );
}

export function resolveSshConfig(): SshConfig {
  const netrc = parseNetrc();
  let host = process.env.GERRIT_SSH_HOST;
  let username = process.env.GERRIT_SSH_USER;
  let port = 29418;

  if (!host) {
    const url = process.env.GERRIT_URL;
    if (url && (url.startsWith("ssh://") || !url.startsWith("http"))) {
      try {
        const parsed = parseSshUrl(url);
        host = parsed.host;
        port = parsed.port;
        if (parsed.username) username = parsed.username;
      } catch {
        // ignore, fall through
      }
    }
  }

  if (!host) {
    throw new Error(
      "GERRIT_SSH_HOST is required for SSH transport. " +
        "Set it or use an SSH URL in GERRIT_URL (e.g. ssh://gerrit.example.com:29418)."
    );
  }

  const portStr = process.env.GERRIT_SSH_PORT;
  if (portStr) {
    port = parseInt(portStr, 10);
  }

  if (!username) {
    const entry = netrc[host] || netrc["default"];
    if (entry && entry.login) {
      username = entry.login;
    }
  }

  if (!username) {
    throw new Error(
      `GERRIT_SSH_USER is required for SSH transport to ${host}. ` +
        "Set it or add a netrc entry for this host."
    );
  }

  const keyPath = process.env.GERRIT_SSH_KEY || join(homedir(), ".ssh", "id_rsa");
  if (!existsSync(keyPath)) {
    throw new Error(
      `SSH private key not found at ${keyPath}. ` +
        "Set GERRIT_SSH_KEY to the correct path."
    );
  }

  const privateKey = readFileSync(keyPath, "utf-8");
  const passphrase = process.env.GERRIT_SSH_KEY_PASSPHRASE;

  return { host, port, username, privateKey, passphrase };
}

export function resolveCredentials(): {
  url: string;
  username: string;
  password: string;
} {
  const url = process.env.GERRIT_URL;
  if (!url) {
    throw new Error(
      "GERRIT_URL environment variable is required. " +
        "Set it to your Gerrit instance URL (e.g. https://gerrit.example.com)."
    );
  }

  const username = process.env.GERRIT_USERNAME;
  const password = process.env.GERRIT_PASSWORD;

  if (username && password) {
    return { url, username, password };
  }

  const netrc = parseNetrc();
  let hostname: string;

  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error(
      `GERRIT_URL is not a valid URL: ${url}. ` +
        "Set it to your Gerrit instance URL (e.g. https://gerrit.example.com)."
    );
  }

  const entry = netrc[hostname] || netrc["default"];
  if (entry && entry.login && entry.password) {
    return {
      url,
      username: username || entry.login,
      password: password || entry.password,
    };
  }

  throw new Error(
    `Could not find credentials for ${hostname}. ` +
      "Set GERRIT_USERNAME and GERRIT_PASSWORD environment variables, " +
      `or add 'machine ${hostname}' entry to ~/.netrc.`
  );
}
