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

## Addendum (2026-09-11, same day)

Approved in chat after the first build:

- **Third depth level, Plain.** Toggle is Plain / Simple / Nerd; Simple stays the default. Each card has a `.plain` block: one paragraph with an everyday analogy (envelope, kitchen, helpers holding a heavy book, sticky notes). On the stage, detail blocks live in a per-scene `plain-hide` group that fades out in Plain and `plain-only` labels fade in; each scene has a plain caption.
- **Profile and preferences.** Step 1 shows the system prompt composed of provider instructions, the user's profile ("software developer, Boston, prefers concise answers") and saved memories, with copy explaining that settings enter the request here as ordinary tokens; step 5 notes the same attention reads them; step 8 notes the profile block is the most reliably cached prefix.
- **Three caches strip** in step 8 (hidden in Plain): KV cache inside one request, prefix cache across requests, answer cache before the model.
- **After the journey** sections: a "who runs which step" table for closed API vs hosted open weights vs laptop, and a three-column note on code generation (identical), diffusion image generation (steps 5 and 6 replaced) and image-token generation.
- **Diagram text size** control (1×, 1.25×, 1.5×) applied as a multiplier in the SVG text helper; scenes rebuild on change; a few dense strings switch to compact variants above 1.1×.
- **Privacy.** A strip in step 3 answering "does sharing the batch expose my question?" (isolated KV blocks, causal masking, frozen weights) linking to an after-journey section `#privacy` that rates each exposure along the journey (wire, GPUs, prefix cache: low; logs and retention, training, human review, memory features, app bugs: real) and gives a checklist for sharing sensitive documents. Policy specifics are framed as things to verify, not fixed facts.
- **Numbers strip.** A lead-in to the outputs section: three rows (text, code, image) each showing input → numbers → the same model → numbers → output, making the point that the model only ever operates on numbers and that the translators at each end are what differ by medium.
- **Training path.** Step 3's privacy strip now distinguishes "nothing is learned now" (frozen weights during inference) from "but later, maybe" (offline training on logged conversations for eligible tiers). The privacy section gains a six-step pipeline: logged at gateway → reactions join → eligibility filter (the gate settings control) → scrubbing and sampling → becomes training data → baked into a future model, plus notes on coding-assistant telemetry and what "delete" reaches. Scene 8's "what persists" labels mention logs and offline training.
