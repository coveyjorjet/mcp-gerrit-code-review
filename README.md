# MCP Gerrit Code Review

[![npm](https://img.shields.io/npm/v/mcp-gerrit-code-review.svg)](https://www.npmjs.com/package/mcp-gerrit-code-review)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

MCP Server providing AI agents with tooling for Gerrit code review workflows via stdio transport.

## Features

- **19 tools** across 4 categories: Changes, Accounts, Projects, Server
- **Basic Auth** with env vars or `~/.netrc` fallback
- **TypeScript strict mode** with Zod input validation
- **ESM modules** with stdio transport

## Installation

### Option 1: Install from npm (Recommended)

```bash
npx mcp-gerrit-code-review
```

Or install globally:

```bash
npm install -g mcp-gerrit-code-review
```

### Option 2: Build from source

```bash
git clone https://github.com/coveyjorjet/mcp-gerrit-code-review.git
cd mcp-gerrit-code-review
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

### Using with OpenCode

Add to your `opencode.json` or `opencode.jsonc`:

#### Using npm package

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "mcp-gerrit-code-review": {
      "type": "local",
      "command": ["npx", "-y", "mcp-gerrit-code-review"],
      "enabled": true,
      "environment": {
        "GERRIT_URL": "https://gerrit.example.com",
        "GERRIT_USERNAME": "your-username",
        "GERRIT_PASSWORD": "your-http-password"
      }
    }
  }
}
```

#### Using local build

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "mcp-gerrit-code-review": {
      "type": "local",
      "command": ["node", "/path/to/mcp-gerrit-code-review/dist/index.js"],
      "enabled": true,
      "environment": {
        "GERRIT_URL": "https://gerrit.example.com",
        "GERRIT_USERNAME": "your-username",
        "GERRIT_PASSWORD": "your-http-password"
      }
    }
  }
}
```

### Other MCP Clients

Add to your MCP client configuration:

#### Using npm package

```json
{
  "mcpServers": {
    "mcp-gerrit-code-review": {
      "command": "npx",
      "args": ["-y", "mcp-gerrit-code-review"],
      "env": {
        "GERRIT_URL": "https://gerrit.example.com",
        "GERRIT_USERNAME": "your-username",
        "GERRIT_PASSWORD": "your-http-password"
      }
    }
  }
}
```

#### Using local build

```json
{
  "mcpServers": {
    "mcp-gerrit-code-review": {
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

> ⚠️ **Mutation tools** (`post_review`, `post_review_comment`, `submit_change`, `abandon_change`, `restore_change`, `add_reviewer`) modify Gerrit state — confirm with user before calling.

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
