---
"oauthlint": patch
---

Fix the auto-managed Opengrep engine silently scanning zero files in environments without a UTF-8 locale (CI containers, `env -i` shells, some minimal Linux setups). Opengrep bundles Python, which read the UTF-8 rule files as ASCII when no UTF-8 locale was set and aborted with a decode error, so a scan reported "no issues" instead of failing. The engine subprocess now runs with a UTF-8 locale and Python UTF-8 mode forced, without touching the parent environment or overriding an existing UTF-8 locale.
