# MCP Gerrit Code Review

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

MCP Server providing AI agents with tooling for Gerrit code review workflows via stdio transport.

## Features

- **19 tools** across 4 categories: Changes, Accounts, Projects, Server
- **Basic Auth** with env vars or `~/.netrc` fallback
- **TypeScript strict mode** with Zod input validation
- **ESM modules** with stdio transport

## Installation

```bash
npm install && npm run build
```

## Configuration

Set via environment variables:

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
      "args": ["dist/index.js"],
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

| Category | Tools | Description |
|----------|-------|-------------|
| **Changes** | `query_changes`, `get_change_details`, `list_change_files`, `get_file_diff`, `get_commit_message`, `post_review`, `post_review_comment`, `list_change_comments`, `submit_change`, `abandon_change`, `restore_change`, `list_reviewers`, `add_reviewer` | Code review operations |
| **Accounts** | `get_account`, `query_accounts` | User account management |
| **Projects** | `list_projects`, `get_project` | Project discovery |
| **Server** | `get_server_info`, `get_server_version` | Server metadata |

> ⚠️ **Mutation tools** (`post_review`, `submit_change`, `abandon_change`, `restore_change`, `add_reviewer`) modify Gerrit state — confirm with user before calling.

## Architecture

```
src/
├── index.ts              # Entry point, MCP server setup
├── gerrit/
│   ├── client.ts         # Gerrit API wrapper with auth
│   └── types.ts          # TypeScript interfaces
├── tools/
│   ├── changes.ts        # 13 change-related tools
│   ├── accounts.ts       # 2 account tools
│   ├── projects.ts       # 2 project tools
│   └── server.ts         # 2 server tools
└── utils/
    └── parsing.ts        # Credential resolution
```

## Development

```bash
npm run dev          # Watch mode rebuild
npm test             # Run tests once
npm run test:watch   # Watch mode tests
npm run lint         # Type check (tsc --noEmit)
```

## License

MIT

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
