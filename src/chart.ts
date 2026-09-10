import { chartSeriesProvider, type ChartSeriesCatalogRequest } from 'gloomberb/capabilities';
import { colors } from 'gloomberb/theme';
import { restQuery, type Fetch } from './rest-client';

export function createMacroChartCapability(readKey: () => string | undefined, request?: Fetch) {
  async function catalog({ query, limit, signal }: ChartSeriesCatalogRequest) {
    const [requestedCurrency, ...words] = (query ?? '').trim().split(/\s+/);
    const currency = /^[a-z]{3}$/i.test(requestedCurrency ?? '') ? requestedCurrency!.toLowerCase() : 'usd';
    const filter = (currency === requestedCurrency?.toLowerCase() ? words.join(' ') : query ?? '').toLowerCase();
    const catalogue = await restQuery('data_catalogue', { currency }, { apiKey: readKey(), request, signal }) as Record<string, { name?: string; unit?: string }>;
    return Object.entries(catalogue).filter(([slug, entry]) => entry && typeof entry === 'object' && typeof entry.name === 'string' && `${slug} ${entry.name}`.toLowerCase().includes(filter))
      .slice(0, limit ?? 20).map(([slug, entry]) => ({ seriesId: `${currency}/${slug}`, label: `${currency.toUpperCase()} ${entry.name}`, description: entry.unit ?? '', style: 'line' as const }));
  }
  return chartSeriesProvider({
    id: 'fxmacrodata-macro', name: 'FXMacroData macro indicators',
    provider: {
      catalog, search: catalog,
      async resolve({ seriesId, viewport, signal }) {
        const [currency, indicator, extra] = seriesId.split('/');
        if (!currency || !indicator || extra) throw new Error('Use currency/indicator from the FXMacroData catalogue.');
        const dateWindow = viewport.dateWindow;
        const args = { currency, indicator, limit: Math.min(viewport.maxPoints ?? 100, 100), ...(dateWindow ? { start_date: dateWindow.start.slice(0, 10), end_date: dateWindow.end.slice(0, 10) } : {}) };
        const options = { apiKey: readKey(), request, signal };
        const [payload, catalogue] = await Promise.all([
          restQuery('indicator_history', args, options) as Promise<{ name?: string; data?: Record<string, unknown>[]; pagination?: { has_more?: boolean } }>,
          restQuery('data_catalogue', { currency, indicator }, options) as Promise<Record<string, { unit?: string; frequency?: string }>>,
        ]);
        const definition = catalogue[indicator];
        let invalid = 0; let assumed = 0;
        const points = (payload.data ?? []).flatMap(row => {
          const date = new Date(String(row.date));
          if (!Number.isFinite(date.getTime())) { invalid++; return []; }
          const availableAt = typeof row.announcement_datetime === 'number' ? new Date(row.announcement_datetime * 1000) : undefined;
          if (row.release_time_assumed) assumed++;
          return [{ date, observedAt: date, ...(availableAt ? { availableAt } : {}), value: typeof row.val === 'number' && Number.isFinite(row.val) ? row.val : null }];
        }).sort((a, b) => a.date.getTime() - b.date.getTime());
        const frequency = definition?.frequency?.toLowerCase();
        const nativeFrequency = frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly' || frequency === 'quarterly' || frequency === 'annual' ? frequency : 'auto';
        return {
          id: `fxmacrodata:${seriesId}`, label: payload.name ?? seriesId, color: colors.textBright,
          unit: definition?.unit ?? '', unitGroup: `fxmacrodata:${definition?.unit ?? indicator}`, nativeFrequency,
          timestampMode: 'period-end', dataShape: 'scalar', style: 'line', transform: 'raw', axis: 'left', panelId: 'main', interpolation: 'none', points,
          warning: [!dateWindow ? 'API default history window; select explicit dates for another window.' : '', payload.pagination?.has_more ? 'More history is available; narrow the window.' : '', assumed ? 'Some publication times are assumed; the chart uses observation dates.' : '', invalid ? `${invalid} rows lack valid observation dates; inspect the research table.` : ''].filter(Boolean).join(' ') || undefined,
        };
      },
    },
  });
}
