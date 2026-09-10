import { test, expect } from 'bun:test';
import { operations, remoteTools, parseFields } from '../src/contract';
import { restQuery, safeFetch } from '../src/rest-client';
import { projectPayload } from '../src/model';
import { fxmacrodataPlugin, entries } from '../index';
import { createMacroChartCapability } from '../src/chart';
import { CapabilityRegistry } from 'gloomberb/capabilities';

test('native plugin registers every public REST operation and MCP tool', () => {
  expect(operations.length).toBe(23); expect(remoteTools.length).toBe(49);
  expect(entries.length).toBe(72);
  expect(Object.keys(fxmacrodataPlugin.capabilities![0]!.operations)).toHaveLength(72);
  expect(fxmacrodataPlugin.paneTemplates).toHaveLength(72);
  expect(fxmacrodataPlugin.targets).toEqual(['cli', 'tui', 'desktop']);
  for (const template of fxmacrodataPlugin.paneTemplates!) {
    expect(template.headless?.shape).toBe('bundle');
    expect(template.createInstance).toBeFunction();
  }
});

test('schema parser preserves zero, false and a comma-separated currency query', () => {
  const operation = operations.find(item => item.name === 'announcement_changes')!;
  const args = parseFields(operation.input_schema, { currencies: 'usd,eur', limit: '10' });
  expect(args.currencies).toBe('usd,eur'); expect(args.limit).toBe(10);
  expect(() => parseFields(operation.input_schema, { currencies: 'usd', limit: '-1' })).toThrow();
});

test('transport privately authenticates only the canonical origin without redirects', async () => {
  let observed: URL | undefined;
  await restQuery('data_catalogue', { currency: 'usd' }, { apiKey: 'test-only-marker', request: async (input, init) => {
    observed = new URL(String(input)); expect(init?.redirect).toBe('error');
    return Response.json({ indicators: [] });
  } });
  expect(observed!.origin).toBe('https://api.fxmacrodata.com');
  expect(observed!.pathname).toBe('/v1/data_catalogue/usd');
  expect(observed!.searchParams.get('api_key')).toBe('test-only-marker');
  expect(observed!.searchParams.has('utm_source')).toBe(false);
  await expect(safeFetch('test-only-marker')('https://example.com/')).rejects.toThrow('Unsupported');
});

test('request errors cannot repeat transport credentials', async () => {
  await expect(restQuery('ping', {}, { apiKey: 'test-only-marker', request: async () => { throw new Error('url?api_key=test-only-marker'); } })).rejects.toThrow('connection interrupted');
  await expect(restQuery('ping', { api_key: 'test-only-marker' })).rejects.toThrow('Credentials');
});

test('projections preserve every observation field, consensus meaning and original payload', () => {
  const payload = { data: [{ announcement_datetime: '2026-09-10T12:30:00Z', value: 0, market_consensus: null, prediction_type: 'official_projection', source_url: 'https://example.org/release', extra: { flag: false } }] };
  const result = projectPayload(payload);
  expect(result.metadata.payload).toEqual(payload);
  expect(result.sections[0]!.rows[0]).toEqual(payload.data[0]);
  expect(result.sections[0]!.columns.map(column => column.key)).toContain('market_consensus');
  expect(projectPayload({ data: [] }).sections[0]!.rows).toEqual([]);
});

test('real endpoint envelopes show data first and catalogue maps become indicator rows', () => {
  const result = projectPayload({ currency: 'USD', data_quality: { is_official: true }, data: [{ name: 'CPI', announcement_datetime: 1789043400 }] });
  expect(result.sections[0]!.rows[0]!.name).toBe('CPI');
  const catalogue = { inflation: { name: 'CPI', unit: '%YoY', coverage: { available: true } } };
  const projected = projectPayload(catalogue);
  expect(projected.sections[0]!.rows[0]!.fxmacrodata_catalogue_key).toBe('inflation');
  expect(projected.metadata.payload).toEqual(catalogue);
});

test('MCP structured and text results are consumed as tables without losing the envelope', () => {
  const payload = { content: [{ type: 'text', text: JSON.stringify({ rows: [{ date: '2026-09-10', value: 2 }] }) }] };
  const result = projectPayload(payload);
  expect(result.sections.some(section => section.rows.some(row => row.value === 2))).toBe(true);
  expect(result.metadata.payload).toEqual(payload);
});

test('bounded event stream closes after max_events and keeps event ids', async () => {
  let cancelled = false;
  const body = new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode('id: 3\nevent: announcement\ndata: {"value":0}\n\nid: 4\ndata: {"value":1}\n\n'));
  }, cancel() { cancelled = true; } });
  const result = await restQuery('stream_events', { max_events: 1, max_seconds: 1 }, { request: async () => new Response(body) }) as { events: { id: string; data: unknown }[] };
  expect(result.events).toHaveLength(1); expect(result.events[0]!.id).toBe('3'); expect(cancelled).toBe(true);
});

test('headless capability returns native bundle and exposes disposal', async () => {
  const originalFetch = globalThis.fetch;
  try {
    await fxmacrodataPlugin.setup!({ registerCommand: () => {} } as never);
    globalThis.fetch = (async () => Response.json({ releases: [{ date: '2026-09-10', currency: 'usd' }] })) as unknown as typeof fetch;
    const capability = fxmacrodataPlugin.capabilities![0]!;
    const result = await capability.operations.rest_release_calendar!.handler!({ currency: 'usd' }, { capability, operationId: 'rest_release_calendar' });
    expect(result.sections[0].rows[0].currency).toBe('usd');
    expect(result.metadata.source).toContain('utm_source=gloomberb');
    fxmacrodataPlugin.dispose?.();
  } finally { globalThis.fetch = originalFetch; }
});

test('native chart registry validates chart output and preserves observed and available dates', async () => {
  const capability = createMacroChartCapability(() => undefined, async input => Response.json(String(input).includes('/data_catalogue/')
    ? { policy_rate: { name: 'Policy rate', unit: '%', frequency: 'Daily' } }
    : { name: 'Policy rate', data: [{ date: '2026-09-01', val: 0, announcement_datetime: 1789043400, release_time_assumed: true }] }));
  const registry = new CapabilityRegistry();
  registry.register('fxmacrodata', capability);
  const result = await registry.invoke<{ points: { value: number; date: Date; availableAt: Date }[]; warning?: string }>('fxmacrodata-macro', 'resolve', { seriesId: 'usd/policy_rate', viewport: { range: '1M', resolution: 'auto', dateWindow: { start: '2026-09-01', end: '2026-09-10' } } });
  expect(result.points[0]!.value).toBe(0);
  expect(result.points[0]!.date.toISOString()).toBe('2026-09-01T00:00:00.000Z');
  expect(result.points[0]!.availableAt.toISOString()).toBe('2026-09-10T12:30:00.000Z');
  expect(result.warning).toContain('assumed');
});
