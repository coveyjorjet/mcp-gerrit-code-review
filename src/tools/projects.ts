import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GerritClient } from "../gerrit/client.js";
import type { GerritProjectInfo } from "../gerrit/types.js";

export function registerProjectTools(
  server: McpServer,
  client: GerritClient,
): void {
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

  server.registerTool(
    "get_project",
    {
      description:
        "Get detailed information about a specific Gerrit project. " +
        "Returns branches, labels, description, and parent project.",
      inputSchema: z.object({
        project_name: z
          .string()
          .describe("Name of the Gerrit project"),
      }),
    },
    async ({ project_name }) => {
      const result = await client.get<GerritProjectInfo>(
        `/projects/${encodeURIComponent(project_name)}`,
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );
}
