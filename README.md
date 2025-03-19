# Data Gouv MCP Server

MCP server for interacting with [Datagouv APIs](https://www.data.gouv.fr/fr/dataservices/?is_restricted=false). Specifically:

- [API Recherche Entreprises](https://recherche-entreprises.api.gouv.fr/docs/)

This MCP server uses [HTTP+SSE transport](https://spec.modelcontextprotocol.io/specification/2024-11-05/basic/transports/#http-with-sse) defined in MCP

## Features

### Tools

- `search-company` - Find up to date information (name, address, list of directors, sector, etc.) about a company listed in France by providing a search query (name of the company, of the CEO, address, etc.)

## Installation

Follow those instructions to run Data Gouv MCP server on your host.

### Requirements

- Node 22 (`lts/jod`)
- pnpm 10

### Instructions

- Install dependencies:

```bash
pnpm install
```

- Run the server:

```bash
pnpm run dev
```

- Configure your favorite MCP client to use this new server:

```json
{
  "mcpServers": {
    "data-gouv": {
      "url": "http://localhost:3001/sse"
    }
  }
}
```

### Debugging

Start the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to debug this server, which is available as a package script:

```bash
pnpm run inspector
```

Access the inspector in your browser at `http://localhost:5173`

## Acknowledgment

- [Frederic Barthelet](https://www.linkedin.com/in/frederic-barthelet/) who allowed me to hit the ground running with building an MCP server in ts.
- [Matt Pocock](https://www.linkedin.com/in/mapocock/) and his always welcome neat TS tricks specifically in the context of writting your own MCP server on AI Hero: https://www.aihero.dev/publish-your-mcp-server-to-npm
