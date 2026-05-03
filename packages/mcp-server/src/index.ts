#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerTools } from './tools';

const API_KEY = process.env.ONECAKE_API_KEY || '';
const API_URL = process.env.ONECAKE_API_URL || 'http://101.96.197.15:3001';
const DEFAULT_PHONE = process.env.ONECAKE_PHONE || '';
const DEFAULT_ADDRESS = process.env.ONECAKE_ADDRESS || '';
const DEFAULT_NAME = process.env.ONECAKE_NAME || 'AI 助手';

if (!API_KEY) {
  console.error('❌ ONECAKE_API_KEY 未设置');
  console.error('请在 https://1cake.com/account/api-keys 获取 API Key');
  console.error('然后设置: export ONECAKE_API_KEY=1ck_yourkey');
  process.exit(1);
}

const tools = registerTools({
  apiKey: API_KEY,
  apiUrl: API_URL,
  defaults: { name: DEFAULT_NAME, phone: DEFAULT_PHONE, address: DEFAULT_ADDRESS },
});

const server = new Server(
  { name: '1cake-mcp-server', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find((t) => t.name === request.params.name);
  if (!tool) return { content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }], isError: true };
  try {
    const result = await tool.handler(request.params.arguments || {});
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error: any) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🍰 1Cake MCP Server 已启动');
}

main().catch((error) => { console.error('Fatal:', error); process.exit(1); });
