import { test, expect } from 'bun:test';
import { redactSecrets } from '../src/redaction';
import { restQuery, safeFetch, MCP_URL } from '../src/rest-client';
import { mcpQuery } from '../src/mcp-client';

const key = 'synthetic-only +/=& marker';
const variants = [key, encodeURIComponent(key), new URLSearchParams({ key }).toString().slice(4)];
const payload = () => ({ data: [{ value: 0, market_consensus: null, source_url: 'https://example.org/release', notes: variants.join(' | '), api_key: 'other-synthetic-credential' }], diagnostics: `Authorization: Bearer unrelated-synthetic-token`, url: 'https://api.fxmacrodata.com/v1/ping?api_key=other-synthetic-credential&limit=2' });
function safe(value: unknown) {
  const text = JSON.stringify(value);
  for (const value of [...variants, 'other-synthetic-credential', 'unrelated-synthetic-token']) expect(text).not.toContain(value);
  expect(text).toContain('[redacted]');
}

test('redaction preserves source fields and native non-enumerable symbol metadata without mutating input', () => {
  const metadata = Symbol.for('mastra.mcp.callToolContent');
  const original = payload(); Object.defineProperty(original, metadata, { value: [{ type: 'text', text: key }] });
  const result = redactSecrets(original, key);
  safe(result); expect(result.data[0]!.value).toBe(0); expect(result.data[0]!.source_url).toBe('https://example.org/release');
  expect((result as any)[metadata][0].text).toBe('[redacted]');
  expect(Object.getOwnPropertyDescriptor(result, metadata)!.enumerable).toBe(false);
  expect(original.data[0]!.notes).toContain(key);
});

test('REST responses redact raw and encoded credentials before public projections', async () => {
  safe(await restQuery('ping', {}, { apiKey: key, request: async () => Response.json(payload()) }));
});

test('event captures redact credentials in data and event identifiers', async () => {
  const frame = `id: ${key}\ndata: ${JSON.stringify(payload())}\n\n`;
  safe(await restQuery('stream_events', { max_events: 1, max_seconds: 1 }, { apiKey: key, request: async () => new Response(frame) }));
});

test('MCP JSON errors are sanitized before the native SDK can log them', async () => {
  const response = await safeFetch(key, async () => Response.json({ jsonrpc: '2.0', id: 1, error: { code: -32603, message: JSON.stringify(payload()) } }))(MCP_URL);
  safe(await response.json()); expect(response.url).toBe('');
});

test('MCP SSE redaction handles credentials split across chunks and preserves framed responses', async () => {
  const text = `id: 7\r\nevent: message\r\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: payload() })}\r\n\r\n`;
  const stream = new ReadableStream<Uint8Array>({ start(controller) {
    for (const character of text) controller.enqueue(new TextEncoder().encode(character)); controller.close();
  } });
  const response = await safeFetch(key, async () => new Response(stream, { headers: { 'content-type': 'text/event-stream' } }))(MCP_URL);
  const result = await response.text(); safe(result); expect(result).toContain('id: 7'); expect(result).toContain('event: message'); expect(result.endsWith('\n\n')).toBe(true);
});

test('actual MCP SDK call returns sanitized result and leaves secrets out of client-visible URLs', async () => {
  const request: typeof fetch = (async (input, init) => {
    expect(new URL(String(input)).searchParams.get('api_key')).toBe(key);
    if (init?.method !== 'POST') return new Response(null, { status: 204 });
    const body = JSON.parse(String(init.body));
    if (body.method === 'notifications/initialized') return new Response(null, { status: 202 });
    const result = body.method === 'initialize' ? { protocolVersion: body.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'synthetic-test', version: '1' } }
      : { content: [{ type: 'text', text: JSON.stringify(payload()) }], structuredContent: payload() };
    return Response.json({ jsonrpc: '2.0', id: body.id, result });
  }) as typeof fetch;
  safe(await mcpQuery('ping', {}, { apiKey: key, request }));
});
