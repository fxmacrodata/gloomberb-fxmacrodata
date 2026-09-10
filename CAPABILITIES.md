# FXMacroData capabilities

The included contract snapshot contains 23 documented REST operations and 49 hosted MCP tools. Public USD catalogue, indicator history and calendar requests require no API key. Other requests depend on the endpoint and your authorized access.

Each result preserves the FXMacroData payload, including original source metadata, units and timestamp fields. Market consensus, official projections and FXMacroData-generated predictions retain separate identities.

| Public contract operation | Native surface |
| --- | --- |
| REST `health` | `FXMD_REST_HEALTH` pane and `fxmacrodata.rest_health` capability |
| REST `ping` | `FXMD_REST_PING` pane and `fxmacrodata.rest_ping` capability |
| REST `forex` | `FXMD_REST_FOREX` pane and `fxmacrodata.rest_forex` capability |
| REST `intraday_reference_rates` | `FXMD_REST_INTRADAY_REFERENCE_RATES` pane and `fxmacrodata.rest_intraday_reference_rates` capability |
| REST `fx_sources` | `FXMD_REST_FX_SOURCES` pane and `fxmacrodata.rest_fx_sources` capability |
| REST `fx_source_universe` | `FXMD_REST_FX_SOURCE_UNIVERSE` pane and `fxmacrodata.rest_fx_source_universe` capability |
| REST `data_catalogue` | `FXMD_REST_DATA_CATALOGUE` pane and `fxmacrodata.rest_data_catalogue` capability |
| REST `release_calendar` | `FXMD_REST_RELEASE_CALENDAR` pane and `fxmacrodata.rest_release_calendar` capability |
| REST `market_sessions` | `FXMD_REST_MARKET_SESSIONS` pane and `fxmacrodata.rest_market_sessions` capability |
| REST `rate_differentials` | `FXMD_REST_RATE_DIFFERENTIALS` pane and `fxmacrodata.rest_rate_differentials` capability |
| REST `curves` | `FXMD_REST_CURVES` pane and `fxmacrodata.rest_curves` capability |
| REST `financial_prices` | `FXMD_REST_FINANCIAL_PRICES` pane and `fxmacrodata.rest_financial_prices` capability |
| REST `press_releases` | `FXMD_REST_PRESS_RELEASES` pane and `fxmacrodata.rest_press_releases` capability |
| REST `risk_sentiment` | `FXMD_REST_RISK_SENTIMENT` pane and `fxmacrodata.rest_risk_sentiment` capability |
| REST `factors` | `FXMD_REST_FACTORS` pane and `fxmacrodata.rest_factors` capability |
| REST `event_predictions` | `FXMD_REST_EVENT_PREDICTIONS` pane and `fxmacrodata.rest_event_predictions` capability |
| REST `latest_announcements` | `FXMD_REST_LATEST_ANNOUNCEMENTS` pane and `fxmacrodata.rest_latest_announcements` capability |
| REST `indicator_history` | `FXMD_REST_INDICATOR_HISTORY` pane and `fxmacrodata.rest_indicator_history` capability |
| REST `cot` | `FXMD_REST_COT` pane and `fxmacrodata.rest_cot` capability |
| REST `latest_commodities` | `FXMD_REST_LATEST_COMMODITIES` pane and `fxmacrodata.rest_latest_commodities` capability |
| REST `commodities` | `FXMD_REST_COMMODITIES` pane and `fxmacrodata.rest_commodities` capability |
| REST `announcement_changes` | `FXMD_REST_ANNOUNCEMENT_CHANGES` pane and `fxmacrodata.rest_announcement_changes` capability |
| REST `stream_events` | `FXMD_REST_STREAM_EVENTS` pane and `fxmacrodata.rest_stream_events` capability |
| MCP `ping` | `FXMD_MCP_PING` pane and `fxmacrodata.mcp_ping` capability |
| MCP `mcp_capabilities` | `FXMD_MCP_MCP_CAPABILITIES` pane and `fxmacrodata.mcp_mcp_capabilities` capability |
| MCP `mcp_auth_guide` | `FXMD_MCP_MCP_AUTH_GUIDE` pane and `fxmacrodata.mcp_mcp_auth_guide` capability |
| MCP `subscribe_for_mcp_access` | `FXMD_MCP_SUBSCRIBE_FOR_MCP_ACCESS` pane and `fxmacrodata.mcp_subscribe_for_mcp_access` capability |
| MCP `data_catalogue` | `FXMD_MCP_DATA_CATALOGUE` pane and `fxmacrodata.mcp_data_catalogue` capability |
| MCP `risk_sentiment` | `FXMD_MCP_RISK_SENTIMENT` pane and `fxmacrodata.mcp_risk_sentiment` capability |
| MCP `macro_news` | `FXMD_MCP_MACRO_NEWS` pane and `fxmacrodata.mcp_macro_news` capability |
| MCP `release_calendar` | `FXMD_MCP_RELEASE_CALENDAR` pane and `fxmacrodata.mcp_release_calendar` capability |
| MCP `release_calendar_visual_artifact` | `FXMD_MCP_RELEASE_CALENDAR_VISUAL_ARTIFACT` pane and `fxmacrodata.mcp_release_calendar_visual_artifact` capability |
| MCP `event_predictions` | `FXMD_MCP_EVENT_PREDICTIONS` pane and `fxmacrodata.mcp_event_predictions` capability |
| MCP `latest_announcements` | `FXMD_MCP_LATEST_ANNOUNCEMENTS` pane and `fxmacrodata.mcp_latest_announcements` capability |
| MCP `announcement_changes` | `FXMD_MCP_ANNOUNCEMENT_CHANGES` pane and `fxmacrodata.mcp_announcement_changes` capability |
| MCP `press_releases` | `FXMD_MCP_PRESS_RELEASES` pane and `fxmacrodata.mcp_press_releases` capability |
| MCP `macro_factor` | `FXMD_MCP_MACRO_FACTOR` pane and `fxmacrodata.mcp_macro_factor` capability |
| MCP `fx_reference_sources` | `FXMD_MCP_FX_REFERENCE_SOURCES` pane and `fxmacrodata.mcp_fx_reference_sources` capability |
| MCP `fx_reference_universe` | `FXMD_MCP_FX_REFERENCE_UNIVERSE` pane and `fxmacrodata.mcp_fx_reference_universe` capability |
| MCP `fx_intraday_reference_rates` | `FXMD_MCP_FX_INTRADAY_REFERENCE_RATES` pane and `fxmacrodata.mcp_fx_intraday_reference_rates` capability |
| MCP `rate_curve` | `FXMD_MCP_RATE_CURVE` pane and `fxmacrodata.mcp_rate_curve` capability |
| MCP `rate_differentials` | `FXMD_MCP_RATE_DIFFERENTIALS` pane and `fxmacrodata.mcp_rate_differentials` capability |
| MCP `latest_commodities` | `FXMD_MCP_LATEST_COMMODITIES` pane and `fxmacrodata.mcp_latest_commodities` capability |
| MCP `forex` | `FXMD_MCP_FOREX` pane and `fxmacrodata.mcp_forex` capability |
| MCP `seasonality` | `FXMD_MCP_SEASONALITY` pane and `fxmacrodata.mcp_seasonality` capability |
| MCP `indicator_query` | `FXMD_MCP_INDICATOR_QUERY` pane and `fxmacrodata.mcp_indicator_query` capability |
| MCP `plot_visual_artifact` | `FXMD_MCP_PLOT_VISUAL_ARTIFACT` pane and `fxmacrodata.mcp_plot_visual_artifact` capability |
| MCP `indicator_visual_artifact` | `FXMD_MCP_INDICATOR_VISUAL_ARTIFACT` pane and `fxmacrodata.mcp_indicator_visual_artifact` capability |
| MCP `forex_visual_artifact` | `FXMD_MCP_FOREX_VISUAL_ARTIFACT` pane and `fxmacrodata.mcp_forex_visual_artifact` capability |
| MCP `commodities_visual_artifact` | `FXMD_MCP_COMMODITIES_VISUAL_ARTIFACT` pane and `fxmacrodata.mcp_commodities_visual_artifact` capability |
| MCP `cot_visual_artifact` | `FXMD_MCP_COT_VISUAL_ARTIFACT` pane and `fxmacrodata.mcp_cot_visual_artifact` capability |
| MCP `policy_rate_differential_visual_artifact` | `FXMD_MCP_POLICY_RATE_DIFFERENTIAL_VISUAL_ARTIFACT` pane and `fxmacrodata.mcp_policy_rate_differential_visual_artifact` capability |
| MCP `macro_briefing_task` | `FXMD_MCP_MACRO_BRIEFING_TASK` pane and `fxmacrodata.mcp_macro_briefing_task` capability |
| MCP `indicator_intel_task` | `FXMD_MCP_INDICATOR_INTEL_TASK` pane and `fxmacrodata.mcp_indicator_intel_task` capability |
| MCP `pair_intel_task` | `FXMD_MCP_PAIR_INTEL_TASK` pane and `fxmacrodata.mcp_pair_intel_task` capability |
| MCP `macro_heatmap_task` | `FXMD_MCP_MACRO_HEATMAP_TASK` pane and `fxmacrodata.mcp_macro_heatmap_task` capability |
| MCP `policy_scenario_modeler_task` | `FXMD_MCP_POLICY_SCENARIO_MODELER_TASK` pane and `fxmacrodata.mcp_policy_scenario_modeler_task` capability |
| MCP `macro_war_room_task` | `FXMD_MCP_MACRO_WAR_ROOM_TASK` pane and `fxmacrodata.mcp_macro_war_room_task` capability |
| MCP `event_impact_replay_task` | `FXMD_MCP_EVENT_IMPACT_REPLAY_TASK` pane and `fxmacrodata.mcp_event_impact_replay_task` capability |
| MCP `quant_scenario_lab_task` | `FXMD_MCP_QUANT_SCENARIO_LAB_TASK` pane and `fxmacrodata.mcp_quant_scenario_lab_task` capability |
| MCP `known_at_time_task` | `FXMD_MCP_KNOWN_AT_TIME_TASK` pane and `fxmacrodata.mcp_known_at_time_task` capability |
| MCP `macro_regime_classifier_task` | `FXMD_MCP_MACRO_REGIME_CLASSIFIER_TASK` pane and `fxmacrodata.mcp_macro_regime_classifier_task` capability |
| MCP `release_risk_score_task` | `FXMD_MCP_RELEASE_RISK_SCORE_TASK` pane and `fxmacrodata.mcp_release_risk_score_task` capability |
| MCP `portfolio_risk_engine_task` | `FXMD_MCP_PORTFOLIO_RISK_ENGINE_TASK` pane and `fxmacrodata.mcp_portfolio_risk_engine_task` capability |
| MCP `fx_trade_setup_task` | `FXMD_MCP_FX_TRADE_SETUP_TASK` pane and `fxmacrodata.mcp_fx_trade_setup_task` capability |
| MCP `fx_backtest_task` | `FXMD_MCP_FX_BACKTEST_TASK` pane and `fxmacrodata.mcp_fx_backtest_task` capability |
| MCP `macro_research_pack_task` | `FXMD_MCP_MACRO_RESEARCH_PACK_TASK` pane and `fxmacrodata.mcp_macro_research_pack_task` capability |
| MCP `market_sessions` | `FXMD_MCP_MARKET_SESSIONS` pane and `fxmacrodata.mcp_market_sessions` capability |
| MCP `cot_data` | `FXMD_MCP_COT_DATA` pane and `fxmacrodata.mcp_cot_data` capability |
| MCP `commodities` | `FXMD_MCP_COMMODITIES` pane and `fxmacrodata.mcp_commodities` capability |
| MCP `financial_prices` | `FXMD_MCP_FINANCIAL_PRICES` pane and `fxmacrodata.mcp_financial_prices` capability |
| MCP `official_dataset_family` | `FXMD_MCP_OFFICIAL_DATASET_FAMILY` pane and `fxmacrodata.mcp_official_dataset_family` capability |

Gloomberb exposes structured tables and a native macro chart-series provider. Hosted web third-party plugins are unsupported by Gloomberb. Mastra preserves native MCP artifact outputs; the consuming UI determines their visual rendering. Neither integration automatically executes trades or creates subscriptions.
