# Agent Journey — Design

**Date:** 2026-09-11 · **Status:** approved in chat (structure, channel, connections)

## Goal

A second page, `agent.html`, following one message to an agent you text from a
messaging app: "Move my 3 pm with Priya to tomorrow and let her know." The
agent runs on a provider's infrastructure, connects to the user's calendar,
email and Sentry, and acts on their behalf. Every step answers one of five
confusions: where data is stored, whether it is encrypted, whether a human is
in the loop, how long it takes, how compute is used.

Vendor-neutral. Grok's bot, Poke-style assistants and similar products are the
category; no product-specific claims.

## Decisions

| Decision | Choice |
|---|---|
| Structure | Separate page beside `index.html`. Shared top header with Prompt / Agent tabs on both pages. |
| Code sharing | Stage engine (primitives, iso cubes, streams, tokenizer, scene management, scroll, depth, text size, keyboard) extracted to `stage.js`; shared styles to `style.css`. Zero build, three files. |
| Channel | Generic messaging app UI, with a note on where iMessage and WhatsApp end encryption. |
| Connections | Calendar, email, Sentry. |
| Depth | Plain / Simple / Nerd, same as the Prompt page. |
| Colours | Green = your message and what is derived from it; pink = what the agent generates or does; grey = machinery. Same as Prompt. |

## Steps

| # | Title | Stage | Confusion answered |
|---|---|---|---|
| 1 | Your messaging app | Phone screen with your message; wire to the platform relay (Apple / Meta) then to the agent's endpoint; lock marks; "end-to-end ends here" at the agent | Encryption |
| 2 | The provider's inbox | Webhook → orchestrator; account lookup; conversation store as stacked slabs "encrypted at rest, provider's keys" | Storage |
| 3 | Context assembly | Orchestrator pulls from Calendar, Email, Sentry via a token vault into one request card with token counts | Storage (copies), compute (context size) |
| 4 | The model call | Provider servers → model API (second company); the Prompt journey compressed to a row; two retention labels | Storage, time |
| 5 | The tool loop | Model → tool call → orchestrator → tool → result → model; loop counter; context bar growing 5k→7k→9k→11k; elapsed seconds | Time, compute |
| 6 | The human in the loop | Phone shows an approval prompt; gated vs. ungated path; "staff can read logs" note | Human in loop |
| 7 | Action and reply | Calls out to Calendar and Email APIs; reply back down the messaging path; ledger of what now exists and who holds it | Storage |
| 8 | While you sleep | Sentry alert webhook wakes the agent; same loop; message pushed to phone; standing permissions and how to revoke | Compute, human in loop |

## After the journey

- **Data map**: party (device, messaging platform, agent provider, model API, your services) × what they hold × encryption × who can read × how long.
- **Time**: waterfall for a four-loop turn: delivery, context fetch, four model calls on growing context, tool executions, your approval wait, reply. Tens of seconds plus however long you take.
- **Bill**: four model calls on 5k/7k/9k/11k input with ~300 output each, plus the provider's subscription. Tens of cents, not a fraction of one.
- Footer with sources (tool-use docs, MCP, OAuth 2.0, messaging platform security pages, Sentry webhooks), keyboard hint, credits.

## Non-goals

No real API calls. No claims about a named product's internals. No dark theme.
