import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GerritClient } from "../gerrit/client.js";
import type {
  GerritChange,
  GerritQueryResult,
  GerritFileInfo,
  GerritDiffInfo,
  GerritCommit,
  GerritComment,
  GerritReviewerInfo,
  GerritReviewInput,
} from "../gerrit/types.js";

const QueryChangesSchema = z.object({
  query: z
    .string()
    .default("status:open")
    .describe("Gerrit query string (e.g. 'status:open', 'project:myproject')"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(25)
    .describe("Maximum number of results to return"),
  start: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Offset for pagination"),
  options: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      "Additional options (e.g. 'CURRENT_REVISION', 'DETAILED_ACCOUNTS')",
    ),
});

const ChangeIdSchema = z.object({
  change_id: z
    .string()
    .describe(
      "Gerrit change ID (numeric, 'project~branch~changeId', or full Change-Id)",
    ),
});

const ChangeIdOptionsSchema = ChangeIdSchema.extend({
  options: z
    .array(z.string())
    .optional()
    .default([])
    .describe("Additional options (e.g. 'ALL_REVISIONS', 'ALL_COMMITS')"),
});

const RevisionIdSchema = ChangeIdSchema.extend({
  revision_id: z
    .string()
    .optional()
    .default("current")
    .describe("Revision ID (defaults to 'current')"),
});

const FilePathSchema = RevisionIdSchema.extend({
  file_path: z.string().describe("File path within the change"),
});

const PostReviewSchema = z.object({
  change_id: z.string().describe("Gerrit change ID"),
  revision_id: z
    .string()
    .optional()
    .default("current")
    .describe("Revision ID (defaults to 'current')"),
  message: z
    .string()
    .optional()
    .describe("Review message / cover letter"),
  labels: z
    .record(z.string(), z.number())
    .optional()
    .describe(
      "Labels to vote on (e.g. {'Code-Review': 1, 'Verified': 1})",
    ),
  tag: z.string().optional().describe("Tag to apply to the review"),
  ready: z
    .boolean()
    .optional()
    .describe("Mark change as ready for review (set WIP to false)"),
  work_in_progress: z
    .boolean()
    .optional()
    .describe("Mark change as work in progress"),
});

const ReviewCommentSchema = z.object({
  change_id: z.string().describe("Gerrit change ID"),
  revision_id: z
    .string()
    .optional()
    .default("current")
    .describe("Revision ID (defaults to 'current')"),
  path: z.string().describe("File path to comment on"),
  message: z.string().describe("Comment text"),
  line: z.number().int().optional().describe("Line number for inline comment"),
  side: z
    .enum(["REVISION", "PARENT"])
    .optional()
    .describe("Side of the diff (REVISION or PARENT, defaults to REVISION)"),
  in_reply_to: z
    .string()
    .optional()
    .describe("ID of a comment to reply to"),
});

const AbandonSchema = z.object({
  change_id: z.string().describe("Gerrit change ID"),
  message: z
    .string()
    .optional()
    .describe("Reason for abandoning the change"),
});

const ReviewerSchema = z.object({
  change_id: z.string().describe("Gerrit change ID"),
  reviewer: z
    .string()
    .describe("Account ID, username, email, or group name to add"),
});

export function registerChangeTools(
  server: McpServer,
  client: GerritClient,
): void {
  server.registerTool(
    "query_changes",
    {
      description:
        "Query Gerrit changes using Gerrit's query syntax. " +
        "Returns a list of changes matching the query. Common queries: " +
        "'status:open', 'status:merged', 'project:myproject', " +
        "'owner:self', 'reviewer:self', 'is:watched'.",
      inputSchema: QueryChangesSchema,
    },
    async ({ query, limit, start, options }) => {
      const params = new URLSearchParams();
      params.set("q", query);
      params.set("n", String(limit));
      if (start > 0) params.set("S", String(start));
      const optList = [
        "CURRENT_REVISION",
        "CURRENT_COMMIT",
        "DETAILED_ACCOUNTS",
        ...options,
      ];
      optList.forEach((o) => params.append("o", o));

      const result = await client.get<GerritQueryResult[]>(
        `/changes/?${params.toString()}`,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_change_details",
    {
      description:
        "Get detailed information about a specific Gerrit change. " +
        "Returns full change metadata including owner, labels, messages, " +
        "revisions, and reviewers.",
      inputSchema: ChangeIdOptionsSchema,
    },
    async ({ change_id, options }) => {
      const params = new URLSearchParams();
      const optList = [
        "CURRENT_REVISION",
        "CURRENT_COMMIT",
        "DETAILED_ACCOUNTS",
        "ALL_REVISIONS",
        "ALL_COMMITS",
        "MESSAGES",
        "REVIEWER_UPDATES",
        "SUBMITTABLE",
        ...options,
      ];
      optList.forEach((o) => params.append("o", o));

      const result = await client.get<GerritChange>(
        `/changes/${encodeURIComponent(change_id)}/detail?${params.toString()}`,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "list_change_files",
    {
      description:
        "List files modified in a Gerrit change. Returns file paths with status " +
        "(A=Added, D=Deleted, R=Renamed, W=Rewritten, M=Modified), size, " +
        "and line counts.",
      inputSchema: RevisionIdSchema,
    },
    async ({ change_id, revision_id }) => {
      const rev = revision_id || "current";
      const result = await client.get<Record<string, GerritFileInfo>>(
        `/changes/${encodeURIComponent(change_id)}/revisions/${encodeURIComponent(rev)}/files`,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_file_diff",
    {
      description:
        "Get the diff of a specific file in a Gerrit change. " +
        "Returns the unified diff content including added, removed, and " +
        "modified lines with context.",
      inputSchema: FilePathSchema,
    },
    async ({ change_id, revision_id, file_path }) => {
      const rev = revision_id || "current";
      const result = await client.get<GerritDiffInfo>(
        `/changes/${encodeURIComponent(change_id)}/revisions/${encodeURIComponent(rev)}/files/${encodeURIComponent(file_path)}/diff`,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_commit_message",
    {
      description:
        "Get the full commit message for a revision of a Gerrit change. " +
        "Includes subject, body, author, committer, and parent commits.",
      inputSchema: RevisionIdSchema,
    },
    async ({ change_id, revision_id }) => {
      const rev = revision_id || "current";
      const result = await client.get<GerritCommit>(
        `/changes/${encodeURIComponent(change_id)}/revisions/${encodeURIComponent(rev)}/commit`,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "post_review",
    {
      description:
        "Post a review on a Gerrit change. Use this to vote on labels " +
        "(e.g. Code-Review: +1), leave a cover message, mark as ready, " +
        "or mark as work-in-progress. This is a mutation — use intentionally.",
      inputSchema: PostReviewSchema,
    },
    async ({ change_id, revision_id, message, labels, tag, ready, work_in_progress }) => {
      const rev = revision_id || "current";
      const body: GerritReviewInput = {};
      if (message) body.message = message;
      if (labels && Object.keys(labels).length > 0) body.labels = labels;
      if (tag) body.tag = tag;
      if (ready !== undefined) body.ready = ready;
      if (work_in_progress !== undefined) body.work_in_progress = work_in_progress;

      const result = await client.post<unknown>(
        `/changes/${encodeURIComponent(change_id)}/revisions/${encodeURIComponent(rev)}/review`,
        body,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "post_review_comment",
    {
      description:
        "Post an inline comment on a specific file/line in a Gerrit change. " +
        "Use this for line-by-line code review comments. Can reply to " +
        "existing comments. This is a mutation — use intentionally.",
      inputSchema: ReviewCommentSchema,
    },
    async ({ change_id, revision_id, path, message, line, side, in_reply_to }) => {
      const rev = revision_id || "current";
      const comment: Record<string, unknown> = {
        path,
        message,
        unresolved: true,
      };
      if (line !== undefined) comment.line = line;
      if (side) comment.side = side;
      if (in_reply_to) {
        comment.in_reply_to = in_reply_to;
        comment.unresolved = undefined;
      }

      const body: GerritReviewInput = {
        comments: { [path]: [comment] },
      };

      const result = await client.post<unknown>(
        `/changes/${encodeURIComponent(change_id)}/revisions/${encodeURIComponent(rev)}/review`,
        body,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "list_change_comments",
    {
      description:
        "List all comments on a Gerrit change. Returns inline comments " +
        "(with file path, line, and range) and file-level comments. " +
        "Includes unresolved status and reply chains.",
      inputSchema: ChangeIdSchema,
    },
    async ({ change_id }) => {
      const result = await client.get<Record<string, GerritComment[]>>(
        `/changes/${encodeURIComponent(change_id)}/comments`,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "submit_change",
    {
      description:
        "Submit a Gerrit change for merging. The change must be ready to submit " +
        "(all required labels approved, no merge conflicts). " +
        "This is a mutation — use intentionally and confirm with the user before calling.",
      inputSchema: ChangeIdSchema,
    },
    async ({ change_id }) => {
      const result = await client.post<GerritChange>(
        `/changes/${encodeURIComponent(change_id)}/submit`,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "abandon_change",
    {
      description:
        "Abandon a Gerrit change. The change will no longer be considered for " +
        "submission. Provide a reason message. " +
        "This is a mutation — use intentionally and confirm with the user before calling.",
      inputSchema: AbandonSchema,
    },
    async ({ change_id, message }) => {
      const body: Record<string, string> = {};
      if (message) body.message = message;

      const result = await client.post<GerritChange>(
        `/changes/${encodeURIComponent(change_id)}/abandon`,
        Object.keys(body).length > 0 ? body : undefined,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "restore_change",
    {
      description:
        "Restore an abandoned Gerrit change back to active status. " +
        "This is a mutation — use intentionally.",
      inputSchema: ChangeIdSchema,
    },
    async ({ change_id }) => {
      const result = await client.post<GerritChange>(
        `/changes/${encodeURIComponent(change_id)}/restore`,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "list_reviewers",
    {
      description:
        "List all reviewers of a Gerrit change. Returns reviewers, CC'd users, " +
        "and removed reviewers along with their approval status.",
      inputSchema: ChangeIdSchema,
    },
    async ({ change_id }) => {
      const result = await client.get<GerritReviewerInfo[]>(
        `/changes/${encodeURIComponent(change_id)}/reviewers`,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "add_reviewer",
    {
      description:
        "Add a reviewer to a Gerrit change. Accepts account ID, username, " +
        "email address, or group name. The reviewer will be notified. " +
        "This is a mutation — use intentionally.",
      inputSchema: ReviewerSchema,
    },
    async ({ change_id, reviewer }) => {
      const body = { reviewer };
      const result = await client.post<unknown>(
        `/changes/${encodeURIComponent(change_id)}/reviewers`,
        body,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}
