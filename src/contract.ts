import Ajv from 'ajv';
import rest from './operations.json';
import mcp from './mcp-tools.json';

export type Arguments = Record<string, unknown>;
export type Schema = { type?: string; properties?: Record<string, Schema>; required?: string[]; default?: unknown; enum?: unknown[]; anyOf?: Schema[]; description?: string; [key: string]: unknown };
export interface Operation { name: string; path: string; method: string; description: string; input_schema: Schema; parameters: { name: string; in: string }[] }
export interface RemoteTool { name: string; description?: string; inputSchema: Schema; annotations?: Record<string, unknown> }
export const operations = rest as unknown as Operation[];
export const remoteTools = mcp as unknown as RemoteTool[];
const ajv = new Ajv({ strict: false, validateFormats: false, useDefaults: true });
const validators = new Map<string, ReturnType<typeof ajv.compile>>();

export function validateArguments(schema: Schema, input: unknown): Arguments {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Provide named parameters.');
  const args = structuredClone(input) as Arguments;
  // Credentials belong to the connection, never a tool argument or query string.
  if (Object.keys(args).some(key => /^(api[_-]?key|authorization|token|password)$/i.test(key))) throw new Error('Credentials must be configured in the connection settings.');
  const key = JSON.stringify(schema);
  let validate = validators.get(key);
  if (!validate) { validate = ajv.compile({ ...schema, additionalProperties: false }); validators.set(key, validate); }
  if (!validate(args)) throw new Error('Parameters do not match this operation. Check required fields, types and limits.');
  return args;
}

export function operation(name: string): Operation {
  const found = operations.find(item => item.name === name);
  if (!found) throw new Error('Unknown FXMacroData operation.');
  return found;
}

export function fieldSchema(schema: Schema): Schema { return schema.anyOf?.find(item => item.type !== 'null') ?? schema; }

export function parseFields(schema: Schema, fields: Record<string, unknown>): Arguments {
  const args: Arguments = {};
  for (const [key, definition] of Object.entries(schema.properties ?? {})) {
    const value = fields[key];
    if (value === '' || value === undefined) continue;
    const type = fieldSchema(definition).type;
    if (typeof value !== 'string') args[key] = value;
    else if (type === 'number' || type === 'integer') args[key] = Number(value);
    else if (type === 'boolean') args[key] = value === 'true' ? true : value === 'false' ? false : value;
    else if (type === 'array' || type === 'object') { try { args[key] = JSON.parse(value); } catch { throw new Error('Provide valid JSON for structured parameters.'); } }
    else args[key] = value;
  }
  return validateArguments(schema, args);
}
