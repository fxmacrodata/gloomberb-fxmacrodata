import type { HeadlessBundleResult, HeadlessPaneColumn, HeadlessPaneRow } from 'gloomberb/types/plugin';
import { WEBSITE } from './rest-client';

export interface TableSection { title: string; columns: HeadlessPaneColumn[]; rows: HeadlessPaneRow[] }
export interface ResearchResult extends HeadlessBundleResult { sections: TableSection[]; metadata: { payload: unknown; source: string; receivedAt: string } }
const firstColumns = ['announcement_datetime_utc', 'announcement_datetime_local', 'announcement_datetime', 'release_date', 'date', 'timestamp', 'currency', 'indicator', 'name', 'val', 'value', 'unit', 'market_consensus', 'prediction_type', 'prediction_source', 'source_url'];

export function displayCell(key: string, value: unknown): string {
  if (key === 'announcement_datetime' && typeof value === 'number' && Number.isFinite(value)) return new Date(value * 1000).toISOString();
  return displayValue(value);
}

export function displayValue(value: unknown): string {
  if (value == null) return 'Unavailable';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Add table presentation without discarding fields or redefining endpoint rows. */
export function projectPayload(payload: unknown): ResearchResult {
  const sections: TableSection[] = [];
  const visit = (value: unknown, title: string, depth: number) => {
    if (depth > 8) return;
    if (Array.isArray(value)) {
      if (!value.length) { sections.push({ title, columns: [], rows: [] }); return; }
      const rows = value.map(item => item && typeof item === 'object' && !Array.isArray(item) ? item as HeadlessPaneRow : { value: item });
      const keys = [...new Set(rows.flatMap(row => Object.keys(row)))];
      keys.sort((a, b) => { const ai = firstColumns.indexOf(a), bi = firstColumns.indexOf(b); return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi); });
      sections.push({ title, rows, columns: keys.map(key => ({ key, header: key, format: value => displayCell(key, value) })) });
    } else if (value && typeof value === 'object') {
      const scalars: HeadlessPaneRow[] = [];
      const contentKeys = ['data', 'rows', 'events', 'announcements', 'predictions', 'prices', 'results'];
      const entries = Object.entries(value).sort(([a], [b]) => (contentKeys.includes(a) ? 0 : 1) - (contentKeys.includes(b) ? 0 : 1));
      for (const [key, child] of entries) {
        if (child && typeof child === 'object') visit(child, `${title} / ${key}`, depth + 1);
        else if (key === 'text' && typeof child === 'string') {
          try { visit(JSON.parse(child), title, depth + 1); } catch { scalars.push({ field: key, value: child }); }
        } else scalars.push({ field: key, value: child });
      }
      if (scalars.length) sections.push({ title, rows: scalars, columns: [{ key: 'field', header: 'Field' }, { key: 'value', header: 'Value', format: displayValue }] });
    } else sections.push({ title, rows: [{ value }], columns: [{ key: 'value', header: 'Value' }] });
  };
  // MCP content blocks contain structured data, text and resource links.
  const obj = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const catalogueEntries = Object.entries(obj);
  const isCatalogue = catalogueEntries.length > 0 && catalogueEntries.every(([, value]) => value && typeof value === 'object' && !Array.isArray(value) && typeof (value as Record<string, unknown>).name === 'string');
  if (isCatalogue) visit(catalogueEntries.map(([key, value]) => ({ fxmacrodata_catalogue_key: key, ...(value as Record<string, unknown>) })), 'Catalogue', 0);
  else if (obj.structuredContent) visit(obj.structuredContent, 'Results', 0);
  else if (Array.isArray(obj.content)) for (const block of obj.content) visit(block, 'Results', 0);
  else visit(payload, 'Results', 0);
  return { sections, metadata: { payload, source: WEBSITE, receivedAt: new Date().toISOString() } };
}
