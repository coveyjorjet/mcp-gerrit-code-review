# Graph Report - .  (2026-05-12)

## Corpus Check
- Corpus is ~4,246 words - fits in a single context window. You may not need a graph.

## Summary
- 76 nodes · 85 edges · 13 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `Changes Tools Category (13 tools)` - 14 edges
2. `src/index.ts Entry Point` - 10 edges
3. `mcp-gerrit-code-review Project` - 9 edges
4. `GerritClient` - 8 edges
5. `Mutation Tools (State-Modifying)` - 6 edges
6. `src/gerrit/client.ts GerritClient` - 4 edges
7. `Tool Registration Pattern` - 4 edges
8. `Zod Schema Input Validation` - 4 edges
9. `Accounts Tools Category (2 tools)` - 3 edges
10. `Projects Tools Category (2 tools)` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Environment Variables Configuration` --semantically_similar_to--> `Credentials Resolution Strategy`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `netrc File Configuration` --semantically_similar_to--> `Credentials Resolution Strategy`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `Mutation Tools (State-Modifying)` --conceptually_related_to--> `post_review Tool`  [EXTRACTED]
  AGENTS.md → README.md
- `Mutation Tools (State-Modifying)` --conceptually_related_to--> `post_review_comment Tool`  [EXTRACTED]
  AGENTS.md → README.md
- `Mutation Tools (State-Modifying)` --conceptually_related_to--> `submit_change Tool`  [EXTRACTED]
  AGENTS.md → README.md

## Hyperedges (group relationships)
- **Four Tool Categories Form Complete MCP Server** — readme_changes_tools, readme_accounts_tools, readme_projects_tools, readme_server_tools [EXTRACTED 1.00]
- **Credentials Resolution Flow** — readme_env_vars_config, readme_netrc_config, agents_pattern_credentials, agents_pattern_basic_auth [INFERRED 0.85]
- **Core Architecture Components** — agents_architecture_index, agents_architecture_client, agents_architecture_types, agents_architecture_parsing [EXTRACTED 1.00]

## Communities

### Community 0 - "Project Overview & Configuration"
Cohesion: 0.11
Nodes (19): Credentials Resolution Strategy, AGENTS.md Project Description, stdio Transport, Accounts Tools Category (2 tools), Development Commands, Environment Variables Configuration, Gerrit Code Review System, get_account Tool (+11 more)

### Community 1 - "Change Management Tools"
Cohesion: 0.18
Nodes (15): Mutation Tools (State-Modifying), abandon_change Tool, add_reviewer Tool, Changes Tools Category (13 tools), get_change_details Tool, get_commit_message Tool, get_file_diff Tool, list_change_comments Tool (+7 more)

### Community 2 - "Architecture & Design Patterns"
Cohesion: 0.26
Nodes (12): src/tools/accounts.ts Account Tools, src/tools/changes.ts Change Tools, src/index.ts Entry Point, src/tools/projects.ts Project Tools, src/tools/server.ts Server Tools, tests/client.test.ts Test File, src/gerrit/types.ts TypeScript Interfaces, ESM Module System (+4 more)

### Community 3 - "GerritClient HTTP Layer"
Cohesion: 0.33
Nodes (1): GerritClient

### Community 4 - "Authentication & Parsing Patterns"
Cohesion: 0.4
Nodes (5): src/gerrit/client.ts GerritClient, src/utils/parsing.ts Parsing Utilities, Authenticated Endpoint Prefix /a, Basic Authentication, Magic Prefix )]}' Stripping

### Community 5 - "Parsing Utilities"
Cohesion: 0.67
Nodes (2): parseNetrc(), resolveCredentials()

### Community 6 - "Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 7 - "Projects Module"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "Changes Module"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Accounts Module"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Server Module"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Type Definitions"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Test Suite"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **21 isolated node(s):** `Gerrit Code Review System`, `MCP Client Configuration`, `query_changes Tool`, `get_change_details Tool`, `list_change_files Tool` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Entry Point`** (2 nodes): `index.ts`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Projects Module`** (2 nodes): `projects.ts`, `registerProjectTools()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Changes Module`** (2 nodes): `changes.ts`, `registerChangeTools()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Accounts Module`** (2 nodes): `accounts.ts`, `registerAccountTools()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Server Module`** (2 nodes): `server.ts`, `registerServerTools()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Type Definitions`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Suite`** (1 nodes): `client.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `mcp-gerrit-code-review Project` connect `Project Overview & Configuration` to `Change Management Tools`?**
  _High betweenness centrality (0.312) - this node is a cross-community bridge._
- **Why does `Changes Tools Category (13 tools)` connect `Change Management Tools` to `Project Overview & Configuration`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Why does `src/index.ts Entry Point` connect `Architecture & Design Patterns` to `Project Overview & Configuration`, `Authentication & Parsing Patterns`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **What connects `Gerrit Code Review System`, `MCP Client Configuration`, `query_changes Tool` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Project Overview & Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._