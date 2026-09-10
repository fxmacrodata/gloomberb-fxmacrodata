import { expect, test } from 'bun:test';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createDefaultConfig } from 'gloomberb/types/config';
import type { CommandDef } from 'gloomberb/types/plugin';
import { SessionAccess } from '../src/access';
import { fxmacrodataPlugin } from '../index';

const hostPackage = import.meta.resolve('gloomberb/package.json');
const hostModule = (path: string) => import(new URL(`./src/${path}`, hostPackage).href);

test('session access changes cancel old requests, blank selects public access, and close forgets keys', async () => {
  const access = new SessionAccess(() => 'synthetic-environment-key');
  const originalFetch = globalThis.fetch;
  try {
    expect(access.key()).toBe('synthetic-environment-key');
    access.set('synthetic-session-key'); expect(access.key()).toBe('synthetic-session-key');
    globalThis.fetch = (async (_input, init) => new Promise((_resolve, reject) => {
      init!.signal!.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
    })) as typeof fetch;
    const oldRequest = access.request('https://api.fxmacrodata.com/v1/ping');
    access.set(''); await expect(oldRequest).rejects.toThrow('cancelled');
    expect(access.key()).toBe(''); expect(JSON.stringify(access)).toBe('{}');
    access.close(); expect(access.key()).toBeUndefined();
    await expect(access.request('https://api.fxmacrodata.com/v1/ping')).rejects.toThrow('closed');
    access.start(); expect(access.key()).toBe('synthetic-environment-key');
  } finally { access.close(); globalThis.fetch = originalFetch; }
});

test('native CLI discovery authenticates headless calls using process environment without config storage', async () => {
  const { createPaneCatalog } = await hostModule('cli/pane-functions/discovery.ts');
  const config = createDefaultConfig(process.cwd());
  const previousKey = process.env.FXMACRODATA_API_KEY;
  const originalFetch = globalThis.fetch;
  let catalog: Awaited<ReturnType<typeof createPaneCatalog>> | undefined;
  try {
    process.env.FXMACRODATA_API_KEY = 'synthetic-headless-key';
    let observedKey: string | null = null;
    globalThis.fetch = (async input => {
      observedKey = new URL(String(input)).searchParams.get('api_key');
      return Response.json({ data: [{ name: 'Synthetic fixture', value: 0 }] });
    }) as typeof fetch;
    catalog = await createPaneCatalog({ config }, [fxmacrodataPlugin]);
    const template = catalog.paneTemplates.get('fxmacrodata-rest_data_catalogue');
    const result = await template.headless.load({ options: { currency: 'usd' } }, { signal: new AbortController().signal });
    expect<string | null>(observedKey).toBe('synthetic-headless-key'); expect(result.sections[0].rows[0].value).toBe(0);
    expect(JSON.stringify(config)).not.toContain('synthetic-headless-key');
    expect(JSON.stringify(result)).not.toContain('synthetic-headless-key');
  } finally {
    catalog?.destroy(); globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.FXMACRODATA_API_KEY; else process.env.FXMACRODATA_API_KEY = previousKey;
  }
});

test('explicit access command removes obsolete stored key and native config/layout exports contain no credentials', async () => {
  const { createPaneDiscoveryContext } = await hostModule('cli/pane-functions/discovery.ts');
  const { exportConfig } = await hostModule('data/config/store/node.ts');
  const { publishableMarketplaceLayout } = await hostModule('layout-marketplace/payload.ts');
  const config = createDefaultConfig(process.cwd());
  config.pluginConfig.fxmacrodata = { apiKey: 'synthetic-obsolete-key', display: 'table' };
  const ctx = createPaneDiscoveryContext({ getConfig: () => config });
  const commands = new Map<string, CommandDef>();
  ctx.registerCommand = (command: CommandDef) => commands.set(command.id, command);
  ctx.configState = {
    get: () => { throw new Error('Credentials must never be read from exportable configuration.'); },
    set: async () => { throw new Error('Credentials must never be written to exportable configuration.'); },
    delete: async (name: string) => { expect(name).toBe('apiKey'); delete config.pluginConfig.fxmacrodata![name]; },
    keys: () => [],
  };
  const originalFetch = globalThis.fetch;
  try {
    await fxmacrodataPlugin.setup!(ctx);
    await commands.get('fxmacrodata-access')!.execute!({ apiKey: 'synthetic-memory-key' });
    const template = fxmacrodataPlugin.paneTemplates!.find(item => item.id === 'fxmacrodata-rest_data_catalogue')!;
    globalThis.fetch = (async input => {
      expect(new URL(String(input)).searchParams.get('api_key')).toBe('synthetic-memory-key');
      return Response.json({ data: [] });
    }) as typeof fetch;
    await template.headless!.load({ options: { currency: 'usd' } } as never, { signal: new AbortController().signal } as never);
    expect(config.pluginConfig.fxmacrodata).toEqual({ display: 'table' });
    config.layout = {
      dockRoot: null,
      instances: [{ instanceId: 'synthetic-pane', paneId: 'fxmacrodata-research', settings: { operation: 'rest_data_catalogue', parameters: { currency: 'usd' } } }],
      floating: [{ instanceId: 'synthetic-pane', x: 0, y: 0, width: 80, height: 24 }], detached: [],
    };
    const outputDirectory = join(process.cwd(), '.test-artifacts');
    await mkdir(outputDirectory, { recursive: true });
    const outputFile = join(outputDirectory, 'credential-free-config.json');
    await exportConfig(config, outputFile);
    const configExport = await readFile(outputFile, 'utf8');
    const layoutExport = JSON.stringify(publishableMarketplaceLayout(config.layout, {}, new Map(fxmacrodataPlugin.panes!.map(pane => [pane.id, pane]))));
    for (const output of [configExport, layoutExport]) {
      expect(output).not.toContain('synthetic-obsolete-key'); expect(output).not.toContain('synthetic-memory-key');
    }
  } finally { fxmacrodataPlugin.dispose?.(); globalThis.fetch = originalFetch; }
});
