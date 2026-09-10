import type { Fetch } from './rest-client';

function environmentKey(): string | undefined {
  // Resolve at runtime in CLI/TUI processes. The desktop renderer does not
  // require Node access and the browser build never embeds environment values.
  const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } };
  return runtime.process?.env?.FXMACRODATA_API_KEY || runtime.process?.env?.FXMD_API_KEY;
}

/** Credentials stay in process memory or the user's process environment. */
export class SessionAccess {
  #key: string | undefined;
  #active = true;
  #requests = new AbortController();
  readonly #environmentKey: () => string | undefined;

  constructor(readEnvironment: () => string | undefined = environmentKey) { this.#environmentKey = readEnvironment; }

  key(): string | undefined {
    return this.#active ? this.#key ?? this.#environmentKey() : undefined;
  }

  start(): void {
    this.close(); this.#active = true; this.#requests = new AbortController();
  }

  set(key: string): void {
    this.#requests.abort(); this.#requests = new AbortController();
    this.#key = key; this.#active = true;
  }

  close(): void {
    this.#requests.abort(); this.#key = undefined; this.#active = false;
  }

  readonly request: Fetch = async (input, init) => {
    if (!this.#active) throw new Error('FXMacroData connection is closed.');
    const signal = init?.signal ? AbortSignal.any([init.signal, this.#requests.signal]) : this.#requests.signal;
    return globalThis.fetch(input, { ...init, signal });
  };
}
