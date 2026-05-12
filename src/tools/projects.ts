import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GerritClient } from "../gerrit/client.js";
import type { GerritProjectInfo } from "../gerrit/types.js";

export function registerProjectTools(
  server: McpServer,
  client: GerritClient,
  availableCommands?: Set<string>,
): void {
  const transport = client.getTransport();
  const isAvailable = (sshCmd?: string) => {
    if (transport === "http") return true;
    if (!sshCmd) return false;
    return availableCommands?.has(sshCmd) ?? false;
  };

  if (isAvailable("ls-projects")) {
    server.registerTool(
      "list_projects",
      {
        description:
          "List Gerrit projects accessible to the current user. " +
          "Can filter by prefix and optionally include descriptions.",
        inputSchema: z.object({
          limit: z
            .number()
            .int()
            .min(1)
            .max(100)
            .optional()
            .describe("Maximum number of projects to return"),
          prefix: z
            .string()
            .optional()
            .describe("Filter projects by name prefix"),
          description: z
            .boolean()
            .optional()
            .describe("Include project descriptions in results"),
        }),
      },
      async ({ limit, prefix, description }) => {
        const params = new URLSearchParams();
        if (limit) params.set("n", String(limit));
        if (prefix) params.set("p", prefix);
        if (description) params.set("d", String(description));

        const result = await client.get<Record<string, GerritProjectInfo>>(
          `/projects/?${params.toString()}`,
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
