# base/

This is the permanent, foundational layer of PVC. Nothing here changes as the system evolves — every document in `../extensions/` builds strictly on top of what's defined here, never contradicting it.

Read both documents, in this order, before anything in `../extensions/`:

1. **[`architecture.md`](./architecture.md)** — the five architectural roles (Page, View, Component, Decoration, Aligner, UI Element) and why they're distinct from any specific implementation.
2. **[`project-structure.md`](./project-structure.md)** — how those roles map onto an actual folder/file layout, and why feature ownership and architectural role are two independent axes.

See [`../README.md`](../README.md) for the full documentation index.
