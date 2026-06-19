<script setup lang="ts">
// Hero signature: a realistic oauthlint scan-output panel.
// Static (no autoplay animation) per the Vercel interface guidelines.
</script>

<template>
  <div
    class="scan-demo"
    role="img"
    aria-label="oauthlint terminal output flagging a JWT alg:none vulnerability and an insecure cookie"
  >
    <div class="sd-bar" aria-hidden="true">
      <span class="sd-dot" /><span class="sd-dot" /><span class="sd-dot" />
      <span class="sd-tab">~/app</span>
    </div>
    <div class="sd-body">
      <p class="sd-cmd"><span class="sd-prompt">$</span> npx oauthlint scan ./src</p>
      <p class="sd-blank" />
      <p class="sd-find">
        <span class="sev sev-error">ERROR</span><span class="rule">auth.jwt.alg-none</span>
      </p>
      <p class="sd-meta">src/auth.ts:14</p>
      <p class="sd-msg">JWT verified with <code>alg: none</code> accepted.</p>
      <p class="sd-doc">→ oauthlint.dev/rules/jwt-alg-none</p>
      <p class="sd-blank" />
      <p class="sd-find">
        <span class="sev sev-warn">WARN</span><span class="rule">auth.cookie.no-secure</span>
      </p>
      <p class="sd-meta">src/server.ts:37</p>
      <p class="sd-blank" />
      <p class="sd-summary">
        <span class="sd-pip" aria-hidden="true">●</span>3 issues · 1 high · scanned in 1.7s
      </p>
    </div>
  </div>
</template>

<style scoped>
.scan-demo {
  width: 100%;
  max-width: 460px;
  margin-inline: auto;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0d1018;
  /* Layered shadow: ambient + direct */
  box-shadow:
    0 1px 1px rgba(10, 8, 30, 0.3),
    0 18px 40px -12px rgba(20, 12, 60, 0.55);
  overflow: hidden;
  font-family: ui-monospace, "JetBrains Mono", "SF Mono", "Menlo", monospace;
  font-size: 13px;
  line-height: 1.55;
  text-align: left;
}

.sd-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  background: #151926;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.sd-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #353b4d;
}
.sd-dot:nth-child(1) { background: #ff5f57; }
.sd-dot:nth-child(2) { background: #febc2e; }
.sd-dot:nth-child(3) { background: #28c840; }
.sd-tab {
  margin-left: 8px;
  color: #6b7390;
  font-size: 11.5px;
}

.sd-body {
  padding: 16px 16px 18px;
  color: #c4cbe0;
}
.sd-body p { margin: 0; }
.sd-blank { height: 0.7em; }

.sd-cmd { color: #e7ebf6; }
.sd-prompt { color: #8a7bff; margin-right: 8px; font-weight: 600; }

.sd-find {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
}
.sev {
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 5px;
}
/* Severity colors carry meaning + text label (non-color redundancy) */
.sev-error { color: #ff6b6b; background: rgba(255, 90, 90, 0.13); }
.sev-warn { color: #ffb454; background: rgba(255, 165, 60, 0.13); }
.rule { color: #e7ebf6; }
.sd-meta { color: #6b7390; padding-left: 2px; }
.sd-msg { color: #aab2cc; padding-left: 2px; }
.sd-msg code {
  background: rgba(255, 107, 107, 0.12);
  color: #ff8a8a;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 0.92em;
}
.sd-doc { color: #8a7bff; padding-left: 2px; }

.sd-summary {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  color: #8b93ad;
  font-variant-numeric: tabular-nums;
}
.sd-pip { color: #ff6b6b; margin-right: 8px; }

@media (max-width: 640px) {
  .scan-demo { max-width: 100%; font-size: 12px; }
}
</style>
