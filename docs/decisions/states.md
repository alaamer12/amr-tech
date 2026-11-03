# iwts state — objective: tree-file posts + Mermaid(Pele) rendering
status: complete
remaining: [x] tree-posts feature + PVC full set published (commit 8535d53) · [x] mermaid fence detection + build-time Pele SVG render · [x] fail-the-build guard for broken diagrams · [x] theme-adaptive CSS var mapping + series tokens · [x] validation (test post 4 SVGs both themes, audit 0 gaps, test post removed) · [x] docs (HOW-TO/README/REQUIREMENTS 17-18) + decision records
decisions: docs/decisions/tree-posts.md · docs/decisions/mermaid-pele.md
uncertainties: Pele server-side text metrics use its own font tables; exotic fonts could measure slightly off — visually verified fine with defaults
findings: (parked) validate.py/2/3 reference deleted sample posts; versioned-dir + tree mixing intentionally unsupported
