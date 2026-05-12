import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GerritClient } from "../gerrit/client.js";
import type { GerritServerInfo } from "../gerrit/types.js";

export function registerServerTools(
  server: McpServer,
  client: GerritClient,
  _availableCommands?: Set<string>,
): void {
  const transport = client.getTransport();

  server.registerTool(
    "get_server_version",
    {
      description:
        "Get the Gerrit server version string. Returns the version of the " +
        "connected Gerrit instance.",
      inputSchema: undefined,
    },
    async () => {
      const result = await client.getVersion();
      return {
        content: [
          { type: "text" as const, text: result },
        ],
      };
    },
  );

  if (transport === "http") {
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
  }
}
