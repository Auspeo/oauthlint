<script setup lang="ts">
// Hero signature: a realistic oauthlint scan-output panel.
// Static (no autoplay) per the Vercel interface guidelines.
</script>

<template>
  <div
    class="scan-demo"
    role="img"
    aria-label="oauthlint terminal output: an ERROR for a JWT alg:none vulnerability and a WARN for an insecure cookie, three issues found"
  >
    <div class="sd-bar" aria-hidden="true">
      <span class="sd-dot" /><span class="sd-dot" /><span class="sd-dot" />
      <span class="sd-tab">~/app</span>
    </div>
    <div class="sd-body">
      <p class="sd-cmd"><span class="sd-prompt">$</span>npx oauthlint scan ./src</p>
      <p class="sd-gap" />

      <p class="sd-find"><span class="sev sev-error">ERROR</span><span class="rule">jwt.alg-none</span></p>
      <p class="sd-meta">src/auth.ts:14</p>
      <p class="sd-msg">A forged token would pass: <code>alg: none</code> is allowed.</p>
      <p class="sd-doc">→ rules/jwt-alg-none</p>
      <p class="sd-gap" />

      <p class="sd-find"><span class="sev sev-warn">WARN</span><span class="rule">cookie.no-secure</span></p>
      <p class="sd-meta">src/server.ts:37</p>
      <p class="sd-msg">Session cookie has no <code>Secure</code> flag.</p>
      <p class="sd-gap" />

      <p class="sd-summary">
        <span class="sd-pip" aria-hidden="true">●</span>3 issues, 1 high, scanned in 1.7s
      </p>
    </div>
  </div>
</template>

<style scoped>
.scan-demo {
  width: 100%;
  max-width: 560px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: #0c0f17;
  box-shadow:
    0 1px 1px rgba(8, 6, 26, 0.4),
    0 28px 60px -18px rgba(24, 14, 70, 0.6);
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  text-align: left;
}

.sd-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 18px;
  background: #141826;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.sd-dot { width: 11px; height: 11px; border-radius: 50%; }
.sd-dot:nth-child(1) { background: #ff5f57; }
.sd-dot:nth-child(2) { background: #febc2e; }
.sd-dot:nth-child(3) { background: #28c840; }
.sd-tab { margin-left: 10px; color: #67708d; font-size: 12px; }

.sd-body {
  padding: 22px 22px 24px;
  color: #c2cae0;
  font-size: 13.5px;
  line-height: 1.45;
}
.sd-body p { margin: 0; }
.sd-gap { height: 1em; }

.sd-cmd { color: #eef1f9; }
.sd-prompt { color: #9a8cff; margin-right: 12px; font-weight: 700; }

.sd-find { display: flex; align-items: center; gap: 12px; }
.sev {
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 6px;
}
.sev-error { color: #ff7a7a; background: rgba(255, 90, 90, 0.14); }
.sev-warn { color: #ffba5c; background: rgba(255, 165, 60, 0.14); }
.rule { color: #eef1f9; }
.sd-meta { color: #67708d; margin-top: 4px; }
.sd-msg { color: #9aa3bf; margin-top: 2px; }
.sd-msg code {
  font-family: inherit;
  background: rgba(255, 122, 122, 0.13);
  color: #ff9595;
  padding: 1px 6px;
  border-radius: 5px;
}
.sd-doc { color: #9a8cff; margin-top: 2px; }

.sd-summary {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  color: #828bab;
  font-variant-numeric: tabular-nums;
}
.sd-pip { color: #ff7a7a; margin-right: 10px; }

@media (max-width: 640px) {
  .scan-demo { border-radius: 14px; }
  .sd-body { padding: 18px 16px 20px; font-size: 12px; }
}
</style>
