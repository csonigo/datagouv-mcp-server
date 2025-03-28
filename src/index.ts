import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Tools } from './mcp/Tools.js';
import getRawBody from 'raw-body';

const server = new Server(
  {
    name: 'Data Gouv MCP Server',
    version: '0.1.0',
  },
  { capabilities: { tools: { listChanged: true } } }
);

const app = express();

server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: Tools.TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tools = new Tools();
  const { name } = request.params;

  switch (name) {
    case 'search-company':
      return tools.searchCompany(
        request.params.arguments as {
          query: string;
          page?: number;
          per_page?: number;
          postal_code?: string;
          naf_code?: string;
          creation_date_min?: string;
          creation_date_max?: string;
          legal_status?: string;
          employee_range?: string;
          company_category?: string;
          sort_by?: string;
          sort_order?: string;
        }
      );
    default:
      throw new Error(`Tool ${name} not found`);
  }
});

let transport: SSEServerTransport | undefined = undefined;

app.get('/sse', async (_req, res) => {
  transport = new SSEServerTransport('/messages', res);
  await server.connect(transport);
});

app.post('/messages', async (req, res) => {
  if (!transport) {
    res.status(400);
    res.json({ error: 'No transport' });
    return;
  }
  const rawBody = await getRawBody(req, {
    limit: '1mb',
    encoding: 'utf-8',
  });
  const messageBody = JSON.parse(rawBody.toString()) as {
    params?: Record<string, unknown>;
  };
  console.log(messageBody);
  if (!messageBody.params) {
    messageBody.params = {};
  }

  await transport.handlePostMessage(req, res, messageBody);
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
