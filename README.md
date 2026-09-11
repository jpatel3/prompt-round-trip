# Prompt Round Trip

An interactive, scroll-driven explainer of what happens when you send a question to Claude or ChatGPT: from your keyboard, over the wire, into a data center, across eight GPUs, through prefill and decode, back to your screen, and then how the next question knows about the last one.

Eight steps, each with an animated isometric scene on a sticky stage and a card that explains what the thing is and how it works. A **Simple / Nerd** toggle adds the internals (formulas, sizes, protocol details). The prompt is editable and its tokens ride the wires.

## Running it

It is a single self-contained `index.html` with no build step. Open the file, or serve it:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Fonts (Chivo Mono, Instrument Sans) load from Google Fonts with system fallbacks. Nothing else is fetched and no API is called; the answer text is a fixed example.

## Publishing

Hosted on GitHub Pages from the `main` branch root. Push to `main` and the site updates within a minute.

## Design

The visual language borrows from Baseten's homepage hero (off-white ground, thin grey rules, isometric cubes, characters streaming along wires, one green and one pink accent, mono labels). The structure borrows from Prompt to Chip (sticky stage plus scroll cards, depth toggle). The approved design spec is in `docs/superpowers/specs/`.

Colour key on the stage: **green** is your request and anything computed from it this turn; **pink** is what is new (generated tokens, the uncached part of a follow-up); grey is other people's traffic and the machinery.

## Caveats

Numbers are typical of frontier-model serving in 2026 and are labelled as ranges. The tokenizer is an approximation. Some providers shard across nodes, use mixture-of-experts, or split prefill and decode across machines; the shape of the journey is the same.
