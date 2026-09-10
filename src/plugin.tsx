import { useEffect, useState } from 'react';
import type { GloomPlugin, HeadlessPaneDefinition, PaneProps, PaneSettingField, PaneSettingsDef, WizardStep } from 'gloomberb/types/plugin';
import { useAppSelector, useShortcut } from 'gloomberb/react';
import { DataTableView, useExternalLinkFooter } from 'gloomberb/components';
import { Box, Text } from 'gloomberb/ui';
import { operations, remoteTools, parseFields, fieldSchema, type Arguments, type Schema } from './contract';
import { restQuery, WEBSITE } from './rest-client';
import { mcpQuery } from './mcp-client';
import { projectPayload, displayValue, displayCell, type ResearchResult } from './model';
import { createMacroChartCapability } from './chart';
import { SessionAccess } from './access';

export const entries = [
  ...operations.map(op => ({ id: `rest_${op.name}`, name: op.name, transport: 'rest' as const, description: op.description, schema: op.input_schema })),
  ...remoteTools.map(tool => ({ id: `mcp_${tool.name}`, name: tool.name, transport: 'mcp' as const, description: tool.description ?? tool.name, schema: tool.inputSchema })),
];
type Entry = typeof entries[number];
const access = new SessionAccess();
const pending = new Set<AbortController>();

function defaults(schema: Schema): Arguments {
  return Object.fromEntries(Object.entries(schema.properties ?? {}).flatMap(([key, value]) => value.default !== undefined && value.default !== null ? [[key, value.default]] : key === 'currency' ? [[key, 'usd']] : []));
}

export async function loadResearch(entry: Entry, input: Arguments, signal?: AbortSignal): Promise<ResearchResult> {
  const controller = new AbortController(); pending.add(controller);
  const abort = () => controller.abort(); signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  try {
    const args = parseFields(entry.schema, input);
    const query = entry.transport === 'rest' ? restQuery : mcpQuery;
    return projectPayload(await query(entry.name, args, { apiKey: access.key(), signal: controller.signal, request: access.request }));
  } finally { pending.delete(controller); signal?.removeEventListener('abort', abort); }
}

export function headless(entry: Entry): HeadlessPaneDefinition<'bundle'> {
  return {
    shape: 'bundle', argument: { kind: 'none' },
    describe: `FXMacroData ${entry.name}`,
    options: Object.entries(entry.schema.properties ?? {}).map(([key, schema]) => ({
      key, type: 'string', description: schema.description ?? key,
      ...(defaults(entry.schema)[key] === undefined ? {} : { defaultValue: String(defaults(entry.schema)[key]) }),
    })),
    async load(args, ctx) { return loadResearch(entry, args.options, ctx.signal); },
  };
}

function settings(entry: Entry, current: Record<string, unknown>): PaneSettingsDef {
  const values = { ...defaults(entry.schema), ...(current.parameters as Arguments ?? {}) };
  return {
    title: 'FXMacroData parameters', values,
    fields: Object.entries(entry.schema.properties ?? {}).map(([key, schema]): PaneSettingField => {
      const resolved = fieldSchema(schema);
      const options = resolved.enum ?? (resolved.type === 'boolean' ? [true, false] : undefined);
      return options ? { key, label: key, type: 'select', options: [{ label: 'Default', value: '' }, ...options.map(value => ({ value: String(value), label: String(value) }))] } : { key, label: key, type: 'text', description: schema.description };
    }),
    applyValue(state, field, value) { return { ...state, parameters: { ...(state.parameters as Arguments ?? values), [field.key]: value } }; },
  };
}

function wizard(entry: Entry): WizardStep[] {
  return Object.entries(entry.schema.properties ?? {}).map(([key, schema]) => {
    const resolved = fieldSchema(schema);
    const value = defaults(entry.schema)[key];
    return { key, label: key, required: entry.schema.required?.includes(key) ?? false,
      type: resolved.enum ? 'select' : ['array', 'object'].includes(resolved.type ?? '') ? 'textarea' : 'text',
      ...(value === undefined ? {} : { defaultValue: String(value) }),
      ...(resolved.enum ? { options: resolved.enum.map(value => ({ label: String(value), value: String(value) })) } : {}),
    };
  });
}

function ResearchPane({ paneId, focused, width, height }: PaneProps) {
  const paneSettings = useAppSelector(state => state.config.layout.instances.find(pane => pane.instanceId === paneId)?.settings);
  const id = String(paneSettings?.operation ?? 'rest_data_catalogue');
  const parameters = (paneSettings?.parameters ?? { currency: 'usd' }) as Arguments;
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const signature = JSON.stringify(parameters);
  useEffect(() => {
    const controller = new AbortController();
    const entry = entries.find(entry => entry.id === id);
    if (!entry) { setError('Unknown operation.'); return; }
    setLoading(true); setError(''); setResult(null); setSectionIndex(0);
    void loadResearch(entry, parameters, controller.signal).then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(() => { if (!controller.signal.aborted) setError('Request unavailable. Check parameters and optional access in FXMacroData settings.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, signature, refresh]);
  useShortcut(event => {
    if (!focused || event.targetEditable) return;
    if (event.name === 'r') setRefresh(value => value + 1);
    if (event.name === ']') setSectionIndex(index => Math.min(index + 1, (result?.sections.length ?? 1) - 1));
    if (event.name === '[') setSectionIndex(index => Math.max(0, index - 1));
  }, { enabled: focused });
  useExternalLinkFooter({ registrationId: 'fxmacrodata', focused, url: WEBSITE, source: 'FXMacroData',
    info: loading ? [{ id: 'loading', parts: [{ text: 'Loading', tone: 'muted' }] }] : error ? [{ id: 'error', parts: [{ text: error, tone: 'warning' }] }] : [],
    hints: [{ id: 'refresh', key: 'r', label: 'refresh', onPress: () => setRefresh(value => value + 1) }, { id: 'sections', key: '[ ]', label: 'section' }],
  });
  const section = result?.sections[sectionIndex];
  const columns = (section?.columns ?? []).map(column => ({ id: column.key, label: column.header, width: Math.max(18, Math.min(44, column.header.length + 4)), align: 'left' as const }));
  const rows = [...(section?.rows ?? [])];
  if (sortColumn) rows.sort((a, b) => displayValue(a[sortColumn]).localeCompare(displayValue(b[sortColumn]), undefined, { numeric: true }) * (sortDirection === 'asc' ? 1 : -1));
  return <Box flexDirection="column" width={width} height={height}>
    <Text>{section ? `${section.title} (${sectionIndex + 1}/${result?.sections.length})` : loading ? 'Loading FXMacroData…' : error || 'No data available'}</Text>
    <DataTableView focused={focused} rootWidth={width} rootHeight={Math.max(1, height - 1)} columns={columns} items={rows}
      sortColumnId={sortColumn} sortDirection={sortDirection} onHeaderClick={column => { setSortColumn(column); setSortDirection(sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'); }}
      selection={{ kind: 'index', selectedIndex: selected, onChange: index => setSelected(index) }}
      getItemKey={(_, index) => String(index)} renderCell={(row, column) => ({ text: displayCell(column.id, row[column.id]) })}
      emptyStateTitle={loading ? 'Loading' : error || 'No observations in this window'} />
  </Box>;
}

export const fxmacrodataPlugin: GloomPlugin = {
  id: 'fxmacrodata', name: 'FXMacroData', version: '0.1.0', toggleable: true,
  description: 'Macroeconomic observations, release calendars and currency research.', homepage: 'https://fxmacrodata.com', targets: ['cli', 'tui', 'desktop'],
  panes: [{ id: 'fxmacrodata-research', name: 'FXMacroData Research', component: ResearchPane, defaultPosition: 'right', tableExport: true,
    settings: context => settings(entries.find(entry => entry.id === context.settings.operation) ?? entries.find(entry => entry.id === 'rest_data_catalogue')!, context.settings),
    portableShare: { private: { settings: ['parameters'] } },
  }],
  paneTemplates: entries.map(entry => ({ id: `fxmacrodata-${entry.id}`, paneId: 'fxmacrodata-research', label: `FXMacroData ${entry.name} (${entry.transport.toUpperCase()})`,
    description: entry.description, keywords: ['fxmacrodata', entry.name, 'macro'], shortcut: { prefix: `FXMD_${entry.id.toUpperCase()}` },
    headless: headless(entry), wizard: wizard(entry),
    createInstance: (_context, options) => ({ title: `FXMacroData ${entry.name}`, settings: { operation: entry.id, parameters: { ...defaults(entry.schema), ...options?.values } } }),
  })),
  capabilities: [{ id: 'fxmacrodata', kind: 'plugin-service', name: 'FXMacroData Research', sourceId: 'fxmacrodata',
    operations: Object.fromEntries(entries.map(entry => [entry.id, {
      kind: 'query', rendererSafe: true,
      input: { parse: (input: unknown) => parseFields(entry.schema, input as Arguments) },
      cli: { summary: entry.description, inputShape: JSON.stringify(entry.schema), outputShape: '{ sections: [{ title, columns, rows }], metadata: { payload, source, receivedAt } }', formats: ['text', 'json'], sideEffectLevel: 'none' },
      handler: (input: Arguments, context: { signal?: AbortSignal }) => loadResearch(entry, input, context.signal),
    }])),
  }, createMacroChartCapability(() => access.key(), access.request)],
  setup(ctx) {
    access.start();
    ctx.registerCommand({ id: 'fxmacrodata-access', label: 'FXMacroData: configure optional API key', keywords: ['fxmacrodata', 'key', 'access'], category: 'config',
      wizard: [{ key: 'apiKey', label: 'API key for this session (blank selects public access)', type: 'password' }],
      async execute(values) {
        // Remove only the obsolete field during this explicit access command.
        // Never read a stored key or put a new key into exportable configuration.
        try { await ctx.configState.delete('apiKey'); }
        catch { throw new Error('Could not remove the previous FXMacroData access setting.'); }
        for (const controller of pending) controller.abort(); pending.clear();
        access.set(typeof values?.apiKey === 'string' ? values.apiKey : '');
      },
    });
    ctx.registerCommand({ id: 'fxmacrodata-calendar', label: 'FXMacroData: USD release calendar', keywords: ['fxmacrodata', 'calendar'], category: 'navigation',
      execute: () => ctx.createPaneFromTemplate('fxmacrodata-rest_release_calendar', { values: { currency: 'usd' } }),
    });
  },
  dispose() { for (const controller of pending) controller.abort(); pending.clear(); access.close(); },
};

export default fxmacrodataPlugin;
