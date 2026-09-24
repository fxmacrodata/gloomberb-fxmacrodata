# FXMacroData for Gloomberb

Research macroeconomic conditions in Gloomberb with [FXMacroData](https://fxmacrodata.com/?utm_source=github&utm_medium=referral&utm_campaign=open_source_integrations&utm_content=gloomberb_readme): chart indicator histories, inspect upcoming releases and query market data in native research panes.

[Subscribe to FXMacroData](https://fxmacrodata.com/subscribe?utm_source=github&utm_medium=referral&utm_campaign=open_source_integrations&utm_content=gloomberb_subscribe) for non-USD data, full available history, FX, commodities and positioning. Use the public USD workflow to evaluate the integration before connecting your subscription.

Evaluate the plugin with the public USD catalogue, recent indicator history and release calendar without an API key. Connect your subscription when you need protected datasets or full available history.

## Install

Use Gloomberb 0.13.3 or newer in the desktop app or terminal. Install this [native plugin](https://github.com/fxmacrodata/gloomberb-fxmacrodata) with:

```sh
gloomberb install fxmacrodata/gloomberb-fxmacrodata
```

Restart Gloomberb and enable **FXMacroData** in its plugin settings. For a local source installation, place this package at `~/.gloomberb/plugins/fxmacrodata/`, with `index.ts` at that directory's root, and run `bun install --production` there.

Third-party plugins run in the desktop and terminal clients. The hosted web app at `term.gloom.sh` runs built-in plugins only.

## Use

Open the command bar and choose **FXMacroData: USD release calendar**. The table keeps confirmed release timestamps and source fields. Announcement epochs display as UTC times while JSON retains the original values. Select any **FXMacroData** research pane to query the other REST operations or hosted MCP tools. Parameter forms show the contract's fields; optional blank fields use the endpoint defaults. Edit parameters through the pane settings. When a result has several sections, choose one from the **Section** menu above the table or with `[` and `]`. `r` refreshes and keeps the current table until the new result arrives. Column headings sort the current table. `o` or the source footer opens FXMacroData.

For macro charts, choose **FXMacroData macro indicators** in Gloomberb's chart-series picker. Search a currency followed by the indicator name, for example `usd inflation`, or use the series ID `usd/policy_rate`. Charts use observation dates; publication timestamps remain separate. Select an explicit chart date window when you need a period other than the API default. The chart reports pagination and assumed publication-time warnings; the corresponding research table retains every original row field and the full endpoint payload.

All 23 documented REST operations and 49 hosted MCP tools from the included public contract snapshot are available through native panes, command discovery and capabilities. This includes catalogue, macro history, release calendar, predictions, news, sessions, FX reference rates, curves, rate differentials, financial prices, factors, risk sentiment, COT, commodities, seasonality, official dataset families, analytical tasks and visual-artifact results. The native chart adapter supports macro indicator histories. Other results appear in structured tables; nested metadata and artifact content remain available in the lossless result envelope.

Headless examples:

```sh
gloomberb fn FXMD_REST_DATA_CATALOGUE --currency usd
gloomberb fn FXMD_REST_RELEASE_CALENDAR --currency usd --json
gloomberb api invoke fxmacrodata.rest_indicator_history '{"currency":"usd","indicator":"policy_rate","limit":20}' --json
```

Use `gloomberb catalog` and `gloomberb api list` to discover input options. Empty windows stay empty. The event-stream operation collects a finite snapshot, bounded by `max_events` (1–100) and `max_seconds` (1–60), then closes the stream. It does not create a background subscription.

## Connect your FXMacroData subscription

Run **FXMacroData: configure optional API key** in the command bar. The password input keeps the key only in memory for the current plugin session. Restarting or disabling the plugin clears it; enter it again when needed. A blank input selects public access for the session, including when an environment key exists. Changing access cancels requests using the previous connection.

For CLI/TUI use, provide your own key through the process environment variable `FXMACRODATA_API_KEY` or `FXMD_API_KEY` before starting Gloomberb. No credential value belongs in a pane parameter, command argument, example, exported configuration or shared layout. The explicit access command also removes the obsolete stored `apiKey` field if an earlier version created it, without reading its value. No key is required for the public USD workflow.

The client uses FXMacroData's documented authentication inside its transport, refuses redirects, and returns sanitized errors. It adds no analytics requests. Website links carry campaign parameters; API and MCP request URLs carry no campaign parameters.

See the [API reference](https://fxmacrodata.com/documentation/reference?utm_source=github&utm_medium=referral&utm_campaign=open_source_integrations&utm_content=gloomberb_docs) for units, access requirements and pagination. Market consensus, official projections and FXMacroData-generated predictions retain their original labels.

## Development

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

The tests use the real Gloomberb capability registry and terminal render harness with fixture responses. React is pinned to the host version for the test renderer. Typechecking covers production code and service tests; the upstream OpenTUI render harness has an optional-argument typing mismatch, so its test runs through Bun. Tests need neither live credentials nor network access.

The MIT licence covers this integration code. FXMacroData names identify the provider and do not grant trademark rights.
