# mcp-gerrit-code-review

MCP Server providing AI agents with minimal, focused tooling for Gerrit code review workflows.

## Setup

```bash
npm install
npm run build
```

## Configuration

Set environment variables:

```bash
export GERRIT_URL=https://gerrit.example.com
export GERRIT_USERNAME=your-username
export GERRIT_PASSWORD=your-http-password
```

Or use `~/.netrc`:

```
machine gerrit.example.com
  login your-username
  password your-http-password
```

## Usage

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "gerrit": {
      "command": "node",
      "args": ["/path/to/mcp-gerrit-code-review/dist/index.js"],
      "env": {
        "GERRIT_URL": "https://gerrit.example.com",
        "GERRIT_USERNAME": "your-username",
        "GERRIT_PASSWORD": "your-http-password"
      }
    }
  }
}
```

## Tools

### Changes (Core) — 13 tools

| Tool | Description |
|------|-------------|
| `query_changes` | Search changes with Gerrit query syntax |
| `get_change_details` | Full change metadata, messages, labels |
| `list_change_files` | Files modified in a change |
| `get_file_diff` | Unified diff for a specific file |
| `get_commit_message` | Full commit message for a revision |
| `post_review` | Vote on labels, leave cover message |
| `post_review_comment` | Post inline/file-level comments |
| `list_change_comments` | All comments on a change |
| `submit_change` | Submit a change for merging |
| `abandon_change` | Abandon a change |
| `restore_change` | Restore an abandoned change |
| `list_reviewers` | List change reviewers |
| `add_reviewer` | Add a reviewer to a change |

### Accounts — 2 tools

| Tool | Description |
|------|-------------|
| `get_account` | Get account details (use 'self' for current user) |
| `query_accounts` | Search accounts by name/email/username |

### Projects — 2 tools

| Tool | Description |
|------|-------------|
| `list_projects` | List accessible projects |
| `get_project` | Get project details (branches, labels, etc.) |

### Server — 2 tools

| Tool | Description |
|------|-------------|
| `get_server_info` | Server configuration and capabilities |
| `get_server_version` | Server version string |

## Development

```bash
npm run dev      # Watch mode
npm test         # Run tests
npm run test:watch  # Watch tests
npm run lint     # Type check
```
