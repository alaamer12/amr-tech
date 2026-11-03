# iwts state — objective: tree-file posts feature + publish full PVC doc set
status: complete
remaining: [x] collection/posts tree model · [x] tree-links mdast plugin · [x] routes + BlogPost page mode + TreeNav · [x] emit-mirrors + content publish · [x] validation (seo-audit 0 gaps, 23/23 playwright checks) · [x] docs (HOW-TO/README/REQUIREMENTS) · [x] commit 8535d53 + push + gh-pages deploy
decisions: docs/decisions/tree-posts.md (feature design; docs/pvc removal as single-source cleanup)
uncertainties: Pagefind "2164 words" is unique-dictionary count, not total — verified all 12 page fragments index full body text
findings: (parked) versioned-directory + tree mixing is intentionally unsupported; validate.py/validate2.py/validate3.py still reference deleted sample posts and will fail until a second post exists
