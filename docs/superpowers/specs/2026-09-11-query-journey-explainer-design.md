# Query Journey Explainer — Design

**Date:** 2026-09-11
**Status:** approved in chat (structure, depth, palette)

## Goal

A single self-contained HTML page that follows one chat prompt from the user's
keyboard through the network, the data center, the GPU, prefill and decode, and
back to the screen, then shows how context is carried into the next turn.
Every step has a visual and an explanation of what the thing is and how it
works internally.

The default prompt is: *"What is the implication of AI on software development
jobs?"* The reader can edit it; the tokens on the wires update.

## References

- **Baseten hero** (baseten.co, first fold): Lottie loop. Off-white ground
  (#F5F8F4), 1px grey grid lines (#D9D9D9), isometric cubes, ASCII characters
  streaming along wires as requests, green (#19E76E) and pink (#FFA9FD) accent
  blocks, Chivo Mono labels. Sets the look.
- **Prompt to Chip** (prompttochip.com): scrollytelling, sticky SVG per stage,
  Simple/Nerd toggle, side depth-nav, particles along connector cables. Sets
  the structure.

## Decisions

| Decision | Choice |
|---|---|
| Structure | Sticky SVG stage (left) + scrolling step cards (right). Scroll position drives the stage. |
| Depth | Every card has a Simple paragraph and a Nerd section behind a global toggle. |
| Palette | Baseten light: off-white, grey grid, green + pink accents, mono labels. Single committed look; no dark theme. |
| Build | Zero build. One `index.html`, inline CSS + JS + SVG. Google Fonts allowed (Chivo Mono, Inter) with system fallbacks. No other external resources. |
| Publish | Same pattern as arxiv-explainers: GitHub Pages from `main`. |
| Mobile | Stage collapses above the cards, shorter (approx 45vh), still sticky. |

## Steps

Each step = one scene on the stage + one card. Stage transitions animate
(300–600 ms). Tokens on wires are the reader's actual prompt tokens.

| # | Title | Stage shows | Simple | Nerd |
|---|---|---|---|---|
| 1 | Your device | Laptop/phone cube, prompt text splitting into token chips, a request envelope | Text becomes tokens; system prompt + history packed in; encrypted | BPE, token IDs, JSON body (`messages[]`, `system`), TLS 1.3, request size |
| 2 | The wire | Wi-Fi → ISP → fiber trunk → edge PoP → API gateway cube; token stream along cable | Packets travel at ~2/3 c; gateway checks who you are and picks a region | Anycast, TLS termination, auth, rate limits, region routing, ~20–80 ms RTT |
| 3 | The data center | Building footprint, rows of racks, scheduler picking a replica, several users' requests merging into one batch | Your request joins a batch with strangers'; a scheduler picks a machine that has the model loaded | Replicas, continuous batching, queueing, load balancing across pods, why batching is what makes inference affordable |
| 4 | The GPU node | 8 GPU cubes, HBM stacks beside each, NVLink lines between them, weights split into shards | The model is too big for one chip; it lives sliced across 8, in very fast memory | Tensor parallel, HBM bandwidth (TB/s), NVLink, weights in bf16/FP8, memory-bound decode |
| 5 | Prefill | All prompt tokens lit at once; attention arrows between tokens; KV cache blocks filling per layer | Reads the whole question in one pass; writes a "notes" cache of everything it read | Q/K/V, causal attention, per-layer KV, cache size = 2 × layers × heads × d_head × tokens × bytes; time-to-first-token |
| 6 | Decode | One new token at a time popping out, reading the KV cache; each token immediately rides the wire back to the device; answer types out | Predicts one token, appends it, repeats; each token streams to you as soon as it exists | Logits → sampling (temperature, top-p), KV append, SSE stream, tokens/sec, why it's memory-bandwidth bound, speculative decoding mention |
| 7 | Back on your screen | Token chips reassembling into a markdown paragraph in a chat bubble | The app stitches the stream into text and renders it | SSE event format, incremental markdown render, stop reasons, usage counts |
| 8 | Your next question | Second prompt typed; whole transcript re-sent; KV cache prefix shows HIT (green) vs MISS (pink); context-window bar filling | The model remembers nothing between calls; the app resends the conversation; a cache of the shared prefix makes turn two fast | Stateless inference, prompt caching, prefix matching, cache TTL, context window limit, compaction/summarization when full |

## Page anatomy

```
<header>   hero: title, one-line intro, prompt input (prefilled), Simple/Nerd toggle
<main>
  .stage   position: sticky; top: 0; height: 100vh; contains one <svg> with 8 <g class="scene">
  .steps   8 × <article class="step" data-step="n"> with .simple and .nerd blocks
<nav>      depth nav: 8 ticks, current highlighted, click scrolls
<footer>   sources / caveats
```

Scroll logic: IntersectionObserver on each `.step`; the most-visible step sets
`data-active` on the stage. CSS transitions handle fades; a small JS timeline
per scene handles token particles (requestAnimationFrame, pauses when the
scene isn't active, respects prefers-reduced-motion).

Tokenization: a client-side approximation (split on whitespace + punctuation,
common suffixes) with fake but stable IDs. Card text says it is approximate.

## Non-goals

- No backend, no real API calls.
- No dark theme.
- No vendor-specific claims presented as fact; numbers are labelled as typical
  ranges for frontier models in 2026.

## Testing

- Manual: open in browser, scroll all 8 steps, toggle Nerd, edit prompt, resize
  to mobile width.
- Automated: headless Chrome screenshot of each step (script in `tools/`), if
  Chrome is available.
