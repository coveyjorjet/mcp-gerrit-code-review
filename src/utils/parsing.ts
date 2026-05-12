import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

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

export function resolveCredentials(): {
  url: string;
  username: string;
  password: string;
} {
  const url = process.env.GERRIT_URL;
  if (!url) {
    throw new Error(
      "GERRIT_URL environment variable is required. " +
        "Set it to your Gerrit instance URL (e.g. https://gerrit.example.com).",
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
        "Set it to your Gerrit instance URL (e.g. https://gerrit.example.com).",
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
      `or add 'machine ${hostname}' entry to ~/.netrc.`,
  );
}
