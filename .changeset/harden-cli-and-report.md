---
"oauthlint": patch
---

Harden the CLI and the HTML report.

- Fix the intermittent exit code 13 from `oauthlint list` on Node 22. The bin no
  longer holds an unsettled top-level await while a command handler calls
  `process.exit()`, and the stdout flush now resolves on stream close or error
  (EPIPE), not only on drain.
- The HTML report (`--format html`) now validates a finding's documentation URL
  scheme before using it as a link, so a custom rule cannot inject a
  `javascript:` URL into the rendered report.
