<script setup lang="ts">
import ScanDemo from './ScanDemo.vue';

const catches = [
  {
    sev: 'error',
    rule: 'jwt.alg-none',
    text: 'A JWT verified with alg: none, so anyone can forge a valid token.',
  },
  {
    sev: 'error',
    rule: 'oauth.hardcoded-secret',
    text: 'A client_secret committed straight into the source tree.',
  },
  {
    sev: 'high',
    rule: 'oauth.no-pkce',
    text: 'A public-client OAuth flow with no PKCE protecting the exchange.',
  },
  {
    sev: 'high',
    rule: 'jwt.localstorage',
    text: 'An access token parked in localStorage, ready for any XSS to read.',
  },
  {
    sev: 'warn',
    rule: 'cookie.no-secure',
    text: 'A session cookie set without Secure or HttpOnly flags.',
  },
  {
    sev: 'warn',
    rule: 'oauth.no-state',
    text: 'An OAuth redirect with no state check, wide open to CSRF.',
  },
];

const steps = [
  {
    n: '01',
    title: 'Run it',
    body: 'One command, no config, no account. Point it at your code and it reads every auth path the way a reviewer would.',
  },
  {
    n: '02',
    title: 'Read the verdict',
    body: 'Each finding names the rule, the exact file and line, what makes it dangerous, and a link to the fix. No noise, no lecture.',
  },
  {
    n: '03',
    title: 'Ship it clean',
    body: 'Fix it yourself, or let --fix handle the safe ones. Wire it into CI and the same bug never comes back.',
  },
];
</script>

<template>
  <main class="lp">
    <!-- HERO -->
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Free &amp; open source · OAuth / OIDC / JWT</p>
          <h1>Catch the auth bugs<br />AI writes.</h1>
          <p class="lede">
            Your AI assistant writes login code in seconds. It also writes the same
            security holes it picked up from the rest of the internet. oauthlint reads
            that code like a security engineer and flags the dangerous patterns before
            they reach production.
          </p>
          <div class="cta-row">
            <a class="btn btn-primary" href="#how">Scan your code</a>
            <a class="btn btn-ghost" href="/rules/">Browse the 30 rules</a>
          </div>
          <p class="microcopy">No sign-up. No telemetry. <code>npx oauthlint scan ./src</code></p>
        </div>
        <div class="hero-demo">
          <ScanDemo />
        </div>
      </div>
    </section>

    <!-- PROBLEM -->
    <section class="band">
      <div class="wrap narrow">
        <p class="eyebrow">The problem</p>
        <h2>Fluent in OAuth. Fluent in OAuth mistakes.</h2>
        <p class="prose">
          Copilot, Cursor and Claude will hand you a working auth flow on demand. They
          will also reach for <code>alg: none</code>, paste your client secret into the
          repo, stash tokens in localStorage and skip PKCE, because those patterns are
          everywhere in their training data. The code runs. The pull request looks
          clean. The vulnerability ships with it.
        </p>
        <p class="prose">
          Generic SAST is too broad to care, and enterprise IAM platforms cost more than
          a startup makes in a year. oauthlint sits in the gap: one focused job, done
          well, for free.
        </p>
      </div>
    </section>

    <!-- WHAT IT CATCHES -->
    <section class="catches">
      <div class="wrap">
        <p class="eyebrow">What it catches</p>
        <h2>Thirty ways auth quietly breaks.</h2>
        <div class="grid">
          <div v-for="c in catches" :key="c.rule" class="card">
            <span class="chip" :class="'chip-' + c.sev">{{ c.sev === 'high' ? 'HIGH' : c.sev.toUpperCase() }}</span>
            <code class="card-rule">{{ c.rule }}</code>
            <p class="card-text">{{ c.text }}</p>
          </div>
        </div>
        <a class="more" href="/rules/">See all 30 rules across OAuth, JWT, cookies, CORS and sessions →</a>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how" class="band">
      <div class="wrap">
        <p class="eyebrow">How it works</p>
        <h2>From scan to fix in one command.</h2>
        <div class="cmd-block" aria-hidden="false">
          <span class="cmd-prompt">$</span> npx oauthlint scan ./src
        </div>
        <div class="steps">
          <div v-for="s in steps" :key="s.n" class="step">
            <span class="step-n">{{ s.n }}</span>
            <h3>{{ s.title }}</h3>
            <p>{{ s.body }}</p>
          </div>
        </div>
        <p class="footnote">Runs on <a href="https://semgrep.dev" target="_blank" rel="noreferrer">Semgrep</a>. Install it once with <code>pipx install semgrep</code> or <code>brew install semgrep</code>.</p>
      </div>
    </section>

    <!-- SURFACES -->
    <section class="surfaces">
      <div class="wrap">
        <p class="eyebrow">Everywhere you ship</p>
        <h2>Your terminal, your CI, your editor.</h2>
        <div class="surf-grid">
          <div class="surf">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 11 2-2-2-2"/><path d="M11 13h4"/><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
            <h3>CLI</h3>
            <p>One command locally or in a pre-commit hook. Pretty output, plus JSON and SARIF.</p>
          </div>
          <div class="surf">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>
            <h3>GitHub Action</h3>
            <p>A Docker-based step that gates every pull request, whatever language your repo speaks.</p>
          </div>
          <div class="surf">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
            <h3>VS Code</h3>
            <p>Inline diagnostics as you type, with a Quick Fix to suppress a line on purpose.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CLOSING -->
    <section class="closing">
      <div class="wrap narrow center">
        <h2>Good auth security shouldn't cost $50k.</h2>
        <p class="prose">
          The fundamentals belong in everyone's toolbox, not behind a sales call.
          oauthlint is free and open source, the developer-first edge of
          <a href="https://github.com/Auspeo">Auspeo</a>'s work on identity security.
        </p>
        <div class="cta-row center-row">
          <a class="btn btn-primary" href="/rules/">Browse the rules</a>
          <a class="btn btn-ghost" href="https://github.com/Auspeo/oauthlint" target="_blank" rel="noreferrer">Star on GitHub</a>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.lp {
  --ink: #0c0f17;
  --sev-error: #ef4444;
  --sev-high: #f97316;
  --sev-warn: #f59e0b;
  --maxw: 1080px;
}
.dark .lp { color-scheme: dark; }

.wrap { max-width: var(--maxw); margin-inline: auto; padding-inline: 24px; }
.wrap.narrow { max-width: 760px; }
.center { text-align: center; }

.eyebrow {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  margin: 0 0 18px;
}

h1 {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(2.6rem, 6vw, 4.4rem);
  line-height: 1.02;
  letter-spacing: -0.03em;
  margin: 0 0 22px;
}
h2 {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.9rem, 3.6vw, 2.9rem);
  line-height: 1.08;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
}
h3 { font-family: var(--font-display); font-weight: 700; }

.lede {
  font-size: clamp(1.05rem, 1.4vw, 1.25rem);
  line-height: 1.6;
  color: var(--vp-c-text-2);
  max-width: 44ch;
  margin: 0 0 28px;
}
.prose {
  font-size: 1.12rem;
  line-height: 1.72;
  color: var(--vp-c-text-2);
  margin: 0 0 18px;
}
code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.86em;
  background: var(--vp-c-default-soft);
  padding: 2px 6px;
  border-radius: 6px;
}

/* HERO */
.hero { padding: clamp(40px, 6vw, 80px) 0 clamp(36px, 5vw, 64px); }
.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(28px, 4vw, 56px);
  align-items: center;
}
.hero-demo { display: flex; justify-content: center; }
.microcopy {
  margin-top: 22px;
  font-size: 0.92rem;
  color: var(--vp-c-text-3);
}
.microcopy code { background: none; padding: 0; color: var(--vp-c-text-2); }

/* Buttons */
.cta-row { display: flex; flex-wrap: wrap; gap: 14px; }
.center-row { justify-content: center; }
.btn {
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  font-size: 0.98rem;
  padding: 12px 24px;
  border-radius: 10px;
  transition: transform 0.12s ease, background-color 0.12s ease, border-color 0.12s ease;
}
.btn:hover { transform: translateY(-1px); }
.btn-primary { background: var(--vp-c-brand-1); color: #fff; }
.btn-primary:hover { background: var(--vp-c-brand-2); }
.btn-ghost { border: 1px solid var(--vp-c-divider); color: var(--vp-c-text-1); }
.btn-ghost:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }

/* Bands */
.band { padding: clamp(52px, 6vw, 88px) 0; }
.band:nth-of-type(even) { background: var(--vp-c-bg-alt); }
.catches, .surfaces, .closing { padding: clamp(52px, 6vw, 88px) 0; }
.catches { background: var(--vp-c-bg-alt); }

/* What it catches grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  margin-top: 14px;
}
.card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  padding: 22px;
  background: var(--vp-c-bg);
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.card:hover { border-color: var(--vp-c-brand-1); transform: translateY(-2px); }
.chip {
  display: inline-block;
  font-family: var(--vp-font-family-mono);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 3px 9px;
  border-radius: 6px;
}
.chip-error { color: var(--sev-error); background: color-mix(in srgb, var(--sev-error) 14%, transparent); }
.chip-high { color: var(--sev-high); background: color-mix(in srgb, var(--sev-high) 14%, transparent); }
.chip-warn { color: var(--sev-warn); background: color-mix(in srgb, var(--sev-warn) 14%, transparent); }
.card-rule {
  display: block;
  margin: 14px 0 8px;
  background: none;
  padding: 0;
  color: var(--vp-c-text-1);
  font-size: 0.95rem;
  font-weight: 600;
}
.card-text { color: var(--vp-c-text-2); line-height: 1.55; margin: 0; font-size: 0.98rem; }
.more {
  display: inline-block;
  margin-top: 28px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

/* Command block */
.cmd-block {
  font-family: var(--vp-font-family-mono);
  font-size: clamp(0.95rem, 1.6vw, 1.15rem);
  background: var(--ink);
  color: #eef1f9;
  border-radius: 12px;
  padding: 20px 24px;
  margin: 8px 0 40px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
}
.cmd-prompt { color: var(--vp-c-brand-1); margin-right: 14px; font-weight: 700; }

/* Steps */
.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 32px;
}
.step-n {
  font-family: var(--vp-font-family-mono);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}
.step h3 { font-size: 1.3rem; margin: 10px 0 8px; }
.step p { color: var(--vp-c-text-2); line-height: 1.65; margin: 0; }
.footnote { margin-top: 40px; color: var(--vp-c-text-3); font-size: 0.95rem; }

/* Surfaces */
.surf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin-top: 14px;
}
.surf {
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  padding: 26px;
}
.surf svg { width: 26px; height: 26px; color: var(--vp-c-brand-1); }
.surf h3 { font-size: 1.2rem; margin: 16px 0 8px; }
.surf p { color: var(--vp-c-text-2); line-height: 1.6; margin: 0; }

.closing h2 { max-width: 18ch; margin-inline: auto; }

@media (max-width: 860px) {
  .hero-grid { grid-template-columns: 1fr; }
  .hero-demo { order: -1; }
  .lede { max-width: none; }
}
</style>
