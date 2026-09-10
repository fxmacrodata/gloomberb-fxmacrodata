import { operation, validateArguments, type Arguments } from './contract';
import { redactMcpResponse, redactSecrets } from './redaction';

export const API_ORIGIN = 'https://api.fxmacrodata.com';
export const MCP_URL = 'https://mcp.fxmacrodata.com/mcp';
export const WEBSITE = 'https://fxmacrodata.com/?utm_source=gloomberb&utm_medium=integration&utm_campaign=open_source_integrations&utm_content=app';
export class PublicRequestError extends Error {}
export type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function safeFetch(apiKey?: string, request: Fetch = fetch): Fetch {
  return async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (![API_ORIGIN, new URL(MCP_URL).origin].includes(url.origin) || url.username || url.password) throw new PublicRequestError('Unsupported connection destination.');
    const headers = new Headers(init?.headers);
    // The documented API-key contract is a query parameter. It is created only
    // inside this transport; callers, settings and errors never receive the URL.
    if (apiKey) url.searchParams.set('api_key', apiKey);
    try {
      const response = await request(url, { ...init, headers, redirect: 'error' });
      if (!response.ok) throw new PublicRequestError(response.status === 401 || response.status === 403 ? 'This request requires FXMacroData access. Check the configured API key.' : response.status === 429 ? 'FXMacroData request limit reached. Retry later.' : 'FXMacroData could not complete the request.');
      return url.origin === new URL(MCP_URL).origin ? await redactMcpResponse(response, apiKey) : response;
    } catch (error) { if (error instanceof PublicRequestError) throw error; throw new PublicRequestError('FXMacroData connection interrupted or unavailable.'); }
  };
}

export async function restQuery(name: string, input: Arguments = {}, options: { apiKey?: string; signal?: AbortSignal; request?: Fetch } = {}): Promise<unknown> {
  const op = operation(name);
  const args = validateArguments(op.input_schema, input);
  let path = op.path;
  const headers = new Headers({ Accept: name === 'stream_events' ? 'text/event-stream' : 'application/json' });
  const url = new URL(path, API_ORIGIN);
  for (const parameter of op.parameters) {
    const value = args[parameter.name];
    if (value === undefined || value === null) continue;
    if (parameter.in === 'path') path = path.replace(`{${parameter.name}}`, encodeURIComponent(String(value)));
    else if (parameter.in === 'header') headers.set(parameter.name, String(value));
    else if (parameter.in === 'query') url.searchParams.set(parameter.name, String(value));
  }
  url.pathname = path;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), name === 'stream_events' ? Number(args.max_seconds ?? 10) * 1000 : 30_000);
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  try {
    const response = await safeFetch(options.apiKey, options.request)(url, { headers, signal: controller.signal });
    if (name === 'stream_events') return redactSecrets(await readEvents(response, Number(args.max_events ?? 10), controller.signal), options.apiKey);
    try { return redactSecrets(await response.json(), options.apiKey); } catch { throw new PublicRequestError('FXMacroData returned an unreadable response.'); }
  } finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', abort); }
}

async function readEvents(response: Response, limit: number, signal: AbortSignal): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) return { events: [], bounded: true };
  const decoder = new TextDecoder();
  const events: unknown[] = [];
  let pending = '';
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (events.length < limit && !signal.aborted) {
      const chunk = await reader.read();
      if (chunk.done) break;
      pending += decoder.decode(chunk.value, { stream: true }).replace(/\r\n/g, '\n');
      if (pending.length > 2_000_000) throw new PublicRequestError('Event exceeds the supported size.');
      let end: number;
      while ((end = pending.indexOf('\n\n')) >= 0 && events.length < limit) {
        const frame = pending.slice(0, end); pending = pending.slice(end + 2);
        const lines = frame.split('\n');
        const data = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (!data) continue;
        let payload: unknown = data;
        try { payload = JSON.parse(data); } catch { /* SSE permits plain text. */ }
        events.push({ id: lines.find(line => line.startsWith('id:'))?.slice(3).trim(), event: lines.find(line => line.startsWith('event:'))?.slice(6).trim() ?? 'message', data: payload });
      }
    }
    return { events, bounded: true };
  } catch { if (signal.aborted) return { events, bounded: true }; throw new PublicRequestError('FXMacroData event stream could not be read.'); }
  finally { signal.removeEventListener('abort', cancel); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
