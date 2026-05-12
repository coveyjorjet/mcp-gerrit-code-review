import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GerritClient } from "../gerrit/client.js";
import type { GerritAccount } from "../gerrit/types.js";

export function registerAccountTools(
  server: McpServer,
  client: GerritClient,
): void {
  server.registerTool(
    "get_account",
    {
      description:
        "Get details of a specific Gerrit account. Use 'self' to get the " +
        "currently authenticated user's account info.",
      inputSchema: z.object({
        account_id: z
          .string()
          .describe("Account ID, username, email, or 'self' for current user"),
      }),
    },
    async ({ account_id }) => {
      const result = await client.get<GerritAccount>(
        `/accounts/${encodeURIComponent(account_id)}`,
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  server.registerTool(
    "query_accounts",
    {
      description:
        "Search for Gerrit accounts by name, username, or email. " +
        "Useful for finding reviewers or looking up account details.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Search query (name, username, or email substring)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(10)
          .describe("Maximum number of results"),
      }),
    },
    async ({ query, limit }) => {
      const params = new URLSearchParams();
      params.set("q", query);
      params.set("n", String(limit));

      const result = await client.get<GerritAccount[]>(
        `/accounts/?${params.toString()}`,
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );
}
