# Security Policy

oauthlint is a security tool, so we take the security of the project itself seriously.

## Reporting a vulnerability

Please report suspected vulnerabilities privately to **security@auspeo.com**.

Do not open a public issue for security problems. Include, where you can:

- a description of the issue and its impact,
- steps to reproduce or a proof of concept,
- the affected version (`oauthlint --version`) and environment.

You can expect an acknowledgement within **3 business days** and a status update
within **10 business days**. We will coordinate a fix and a disclosure timeline
with you, and credit you in the release notes unless you prefer to stay anonymous.

## Scope

In scope: the `oauthlint` CLI, the `oauthlint-rules` package, the GitHub Action,
and the VS Code extension in this repository.

Out of scope: vulnerabilities in [Semgrep](https://semgrep.dev) itself (report
those upstream), and findings produced *by* oauthlint about your own code (that
is the tool working as intended).

## Supported versions

The latest minor release on npm receives security fixes. oauthlint is pre-1.0,
so please stay on the most recent version.
