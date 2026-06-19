---
layout: page
title: Type lab
description: Internal font comparison — not linked, removed after the pick.
head:
  - - link
    - { rel: preconnect, href: 'https://fonts.googleapis.com' }
  - - link
    - { rel: preconnect, href: 'https://fonts.gstatic.com', crossorigin: '' }
  - - link
    - { rel: stylesheet, href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Unbounded:wght@400;600;800&family=Big+Shoulders+Display:wght@500;700;800&family=Schibsted+Grotesk:wght@400;500;700&family=Sora:wght@400;600;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap' }
---

<div class="tl">

<p class="tl-intro">Type lab — pick a <strong>heading</strong> (the big visible one) and a <strong>body</strong>. Tell me the numbers, e.g. “heading 4 + body 1”. Body stays Hanken in the heading samples so you judge the heading alone.</p>

## Heading candidates

<section class="opt" style="--h: 'Hubot Sans Variable'">
  <p class="lbl">H1 — Hubot Sans <span>· current · GitHub’s robotic grotesque</span></p>
  <p class="wm">oauthlint</p>
  <p class="hl">Catch the auth bugs AI writes.</p>
  <p class="bd">A free Semgrep linter for the OAuth, OIDC and JWT anti-patterns that AI coding tools ship.</p>
</section>

<section class="opt" style="--h: 'Space Grotesk'">
  <p class="lbl">H2 — Space Grotesk <span>· mechanical, mono-derived, techy</span></p>
  <p class="wm">oauthlint</p>
  <p class="hl">Catch the auth bugs AI writes.</p>
  <p class="bd">A free Semgrep linter for the OAuth, OIDC and JWT anti-patterns that AI coding tools ship.</p>
</section>

<section class="opt" style="--h: 'Schibsted Grotesk'">
  <p class="lbl">H3 — Schibsted Grotesk <span>· clean modern grotesque, confident</span></p>
  <p class="wm">oauthlint</p>
  <p class="hl">Catch the auth bugs AI writes.</p>
  <p class="bd">A free Semgrep linter for the OAuth, OIDC and JWT anti-patterns that AI coding tools ship.</p>
</section>

<section class="opt" style="--h: 'Fraunces'">
  <p class="lbl">H4 — Fraunces <span>· editorial serif, lots of character</span></p>
  <p class="wm">oauthlint</p>
  <p class="hl">Catch the auth bugs AI writes.</p>
  <p class="bd">A free Semgrep linter for the OAuth, OIDC and JWT anti-patterns that AI coding tools ship.</p>
</section>

<section class="opt" style="--h: 'Unbounded'">
  <p class="lbl">H5 — Unbounded <span>· bold geometric, distinctive / loud</span></p>
  <p class="wm">oauthlint</p>
  <p class="hl">Catch the auth bugs AI writes.</p>
  <p class="bd">A free Semgrep linter for the OAuth, OIDC and JWT anti-patterns that AI coding tools ship.</p>
</section>

<section class="opt" style="--h: 'Big Shoulders Display'">
  <p class="lbl">H6 — Big Shoulders Display <span>· industrial condensed, poster energy</span></p>
  <p class="wm">oauthlint</p>
  <p class="hl">Catch the auth bugs AI writes.</p>
  <p class="bd">A free Semgrep linter for the OAuth, OIDC and JWT anti-patterns that AI coding tools ship.</p>
</section>

<section class="opt" style="--h: 'Martian Mono Variable'">
  <p class="lbl">H7 — Martian Mono <span>· mono-led headline, full terminal identity</span></p>
  <p class="wm wm-mono">oauthlint</p>
  <p class="hl hl-mono">Catch the auth bugs AI writes.</p>
  <p class="bd">A free Semgrep linter for the OAuth, OIDC and JWT anti-patterns that AI coding tools ship.</p>
</section>

## Body candidates

<section class="opt" style="--b: 'Hanken Grotesk Variable'">
  <p class="lbl">B1 — Hanken Grotesk <span>· current · soft humanist workhorse</span></p>
  <p class="bd bdt">Copilot, Cursor and Claude will hand you a working auth flow on demand. They will also reach for alg: none, paste your client secret into the repo, stash tokens in localStorage and skip PKCE. The code runs, the pull request looks clean, and the vulnerability ships with it.</p>
</section>

<section class="opt" style="--b: 'Sora'">
  <p class="lbl">B2 — Sora <span>· geometric, slightly technical</span></p>
  <p class="bd bdt">Copilot, Cursor and Claude will hand you a working auth flow on demand. They will also reach for alg: none, paste your client secret into the repo, stash tokens in localStorage and skip PKCE. The code runs, the pull request looks clean, and the vulnerability ships with it.</p>
</section>

<section class="opt" style="--b: 'IBM Plex Sans'">
  <p class="lbl">B3 — IBM Plex Sans <span>· corporate-techy, neutral with edge</span></p>
  <p class="bd bdt">Copilot, Cursor and Claude will hand you a working auth flow on demand. They will also reach for alg: none, paste your client secret into the repo, stash tokens in localStorage and skip PKCE. The code runs, the pull request looks clean, and the vulnerability ships with it.</p>
</section>

<section class="opt" style="--b: 'Schibsted Grotesk'">
  <p class="lbl">B4 — Schibsted Grotesk <span>· modern grotesque body</span></p>
  <p class="bd bdt">Copilot, Cursor and Claude will hand you a working auth flow on demand. They will also reach for alg: none, paste your client secret into the repo, stash tokens in localStorage and skip PKCE. The code runs, the pull request looks clean, and the vulnerability ships with it.</p>
</section>

</div>

<style>
.tl { max-width: 820px; margin: 0 auto; padding: 24px 24px 100px; }
.tl-intro { color: var(--vp-c-text-2); line-height: 1.6; margin-bottom: 8px; }
.tl h2 { font-family: var(--vp-font-family-mono); font-size: 0.8rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--vp-c-text-3); border: none; margin: 48px 0 0; padding: 0; }
.opt { border-top: 1px solid var(--vp-c-divider); padding: 32px 0; }
.lbl { font-family: var(--vp-font-family-mono); font-size: 13px; color: var(--vp-c-brand-1); margin: 0 0 16px; }
.lbl span { color: var(--vp-c-text-3); }
.wm { font-family: var(--h); font-weight: 800; font-size: 2.3rem; letter-spacing: -0.03em; margin: 0 0 6px; line-height: 1; }
.wm-mono { font-weight: 600; letter-spacing: -0.02em; }
.hl { font-family: var(--h); font-weight: 700; font-size: clamp(1.9rem, 5vw, 3.1rem); line-height: 1.04; letter-spacing: -0.025em; margin: 0 0 16px; }
.hl-mono { font-weight: 600; letter-spacing: -0.01em; font-size: clamp(1.5rem, 4vw, 2.4rem); }
.bd { font-family: 'Hanken Grotesk Variable', sans-serif; font-size: 1.12rem; line-height: 1.6; color: var(--vp-c-text-2); max-width: 56ch; margin: 0; }
.bdt { font-family: var(--b), sans-serif; }
</style>
