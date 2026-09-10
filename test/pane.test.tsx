import { expect, test } from 'bun:test';
import { act } from 'react';
import { testRender, AppContext, PaneInstanceProvider, createInitialState } from 'gloomberb/test-support';
import { createDefaultConfig } from 'gloomberb/types/config';
import { fxmacrodataPlugin } from '../index';

test('host renderer displays the native release table with human-readable UTC time', async () => {
  const originalFetch = globalThis.fetch;
  const config = createDefaultConfig(process.cwd());
  config.layout.instances.push({ instanceId: 'fxmd-test-pane', paneId: 'fxmacrodata-research', settings: { operation: 'rest_release_calendar', parameters: { currency: 'usd' } } });
  const state = createInitialState(config);
  const Pane = fxmacrodataPlugin.panes![0]!.component;
  let view: Awaited<ReturnType<typeof testRender>> | undefined;
  try {
    await fxmacrodataPlugin.setup!({ registerCommand: () => {} } as never);
    globalThis.fetch = (async () => Response.json({ data: [{ announcement_datetime: 1789043400, name: 'Consumer prices', release_date_confirmed: true }] })) as unknown as typeof fetch;
    await act(async () => {
      view = await testRender(<AppContext value={{ state, dispatch: () => {} }}><PaneInstanceProvider paneId="fxmd-test-pane"><Pane paneId="fxmd-test-pane" paneType="fxmacrodata-research" focused width={160} height={14} /></PaneInstanceProvider></AppContext>, { width: 160, height: 14 });
    });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)); });
    await view!.renderOnce();
    const frame = view!.captureCharFrame();
    expect(frame).toContain('Consumer prices');
    expect(frame).toContain('2026-09-10T12:30:00');
  } finally {
    if (view) await act(async () => { view!.renderer.destroy(); });
    globalThis.fetch = originalFetch;
    fxmacrodataPlugin.dispose?.();
  }
});
