import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GerritClient } from "../gerrit/client.js";
import type { GerritServerInfo } from "../gerrit/types.js";

export function registerServerTools(
  server: McpServer,
  client: GerritClient,
): void {
  server.registerTool(
    "get_server_info",
    {
      description:
        "Get Gerrit server configuration info. Returns server capabilities, " +
        "authentication methods, change settings, download schemes, and plugin info.",
      inputSchema: undefined,
    },
    async () => {
      const result = await client.get<GerritServerInfo>(
        "/config/server/info",
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  server.registerTool(
    "get_server_version",
    {
      description:
        "Get the Gerrit server version string. Returns the version of the " +
        "connected Gerrit instance.",
      inputSchema: undefined,
    },
    async () => {
      const result = await client.get<string>(
        "/config/server/version",
      );
      return {
        content: [
          { type: "text" as const, text: result },
        ],
      };
    },
  );
}
