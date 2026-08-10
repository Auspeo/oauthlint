---
"oauthlint-rules": patch
---

Eliminate `auth.flow.timing-unsafe-compare` false positives on non-secret equality checks (dependency-injection tokens, error codes, class names), and skip `sample`, `benchmark`, and `integration` trees. Verified against the validation corpus: the clean auth libraries stay at zero while the next-auth true positive and all high-signal findings are preserved.
