#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GerritClient } from "./gerrit/client.js";
import { registerChangeTools } from "./tools/changes.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerServerTools } from "./tools/server.js";

async function main(): Promise<void> {
  const server = new McpServer({
    name: "gerrit-code-review",
    version: "0.1.0",
  });

  const client = new GerritClient();

  registerChangeTools(server, client);
  registerAccountTools(server, client);
  registerProjectTools(server, client);
  registerServerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  server.sendLoggingMessage({
    level: "info",
    data: `Gerrit MCP server connected to ${client.getBaseUrl()}`,
  });
}

main().catch((err) => {
  console.error("Fatal error starting Gerrit MCP server:", err);
  process.exit(1);
});
