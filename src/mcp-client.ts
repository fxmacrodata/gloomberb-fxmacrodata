import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { MCP_URL, PublicRequestError, safeFetch, type Fetch } from './rest-client';
import { remoteTools, validateArguments, type Arguments } from './contract';
import { redactSecrets } from './redaction';

/** One bounded connection per invocation; no retained background streams. */
export async function mcpQuery(name: string, input: Arguments, options: { apiKey?: string; signal?: AbortSignal; request?: Fetch } = {}): Promise<unknown> {
  const tool = remoteTools.find(tool => tool.name === name);
  if (!tool) throw new PublicRequestError('Unknown FXMacroData tool.');
  const args = validateArguments(tool.inputSchema, input);
  const client = new Client({ name: 'gloomberb-fxmacrodata', version: '0.1.0' });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), { fetch: safeFetch(options.apiKey, options.request) });
  const abort = () => { void client.close().catch(() => {}); };
  options.signal?.addEventListener('abort', abort, { once: true });
  try {
    if (options.signal?.aborted) throw new PublicRequestError('Request cancelled.');
    await client.connect(transport, { timeout: 30_000 });
    const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 45_000, signal: options.signal });
    if (result.isError) throw new PublicRequestError('FXMacroData could not complete this tool. Check inputs and access.');
    return redactSecrets(result, options.apiKey);
  } catch (error) {
    if (error instanceof PublicRequestError) throw error;
    throw new PublicRequestError('FXMacroData tool unavailable. Check the connection, parameters and access.');
  } finally { options.signal?.removeEventListener('abort', abort); await client.close().catch(() => {}); }
}
