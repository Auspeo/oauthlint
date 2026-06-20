<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const CMD = 'npx oauthlint scan ./src';
const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const findings = [
  { sev: 'error', label: 'ERROR', rule: 'jwt.alg-none', loc: 'src/auth.ts:14' },
  { sev: 'warn', label: 'WARN', rule: 'cookie.no-secure', loc: 'src/server.ts:37' },
  { sev: 'high', label: 'HIGH', rule: 'oauth.no-pkce', loc: 'src/auth.ts:48' },
];

const typed = ref('');
const scanning = ref(false);
const spin = ref(0);
const revealed = ref(0);
const done = ref(false);
const root = ref<HTMLElement | null>(null);

let running = false;
let gen = 0;
let spinTimer: ReturnType<typeof setInterval> | null = null;
let io: IntersectionObserver | null = null;
const pending = new Set<ReturnType<typeof setTimeout>>();

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(() => {
      pending.delete(t);
      resolve();
    }, ms);
    pending.add(t);
  });

function reset() {
  typed.value = '';
  scanning.value = false;
  revealed.value = 0;
  done.value = false;
}

function finalState() {
  typed.value = CMD;
  scanning.value = false;
  revealed.value = findings.length;
  done.value = true;
}

async function runLoop(myGen: number) {
  while (running && myGen === gen) {
    reset();
    await wait(600);
    for (let i = 1; i <= CMD.length; i++) {
      if (myGen !== gen) return;
      typed.value = CMD.slice(0, i);
      await wait(34);
    }
    await wait(300);
    if (myGen !== gen) return;

    scanning.value = true;
    spinTimer = setInterval(() => {
      spin.value = (spin.value + 1) % SPIN.length;
    }, 80);
    await wait(1100);
    if (spinTimer) clearInterval(spinTimer);
    spinTimer = null;
    scanning.value = false;
    if (myGen !== gen) return;

    for (let i = 0; i < findings.length; i++) {
      if (myGen !== gen) return;
      revealed.value = i + 1;
      await wait(320);
    }
    await wait(150);
    if (myGen !== gen) return;
    done.value = true;

    await wait(4500); // hold the result before looping
  }
}

function start() {
  if (running) return;
  running = true;
  gen += 1;
  runLoop(gen);
}

function stop() {
  running = false;
  gen += 1;
  if (spinTimer) {
    clearInterval(spinTimer);
    spinTimer = null;
  }
}

onMounted(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window) || !root.value) {
    finalState();
    return;
  }
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) start();
        else stop();
      }
    },
    { threshold: 0.3 },
  );
  io.observe(root.value);
});

onBeforeUnmount(() => {
  stop();
  for (const t of pending) clearTimeout(t);
  pending.clear();
  io?.disconnect();
});
</script>

<template>
  <div
    ref="root"
    class="term"
    role="img"
    aria-label="oauthlint scan output: an ERROR for jwt.alg-none, a WARN for cookie.no-secure, a HIGH for oauth.no-pkce, three issues found"
  >
    <div class="bar" aria-hidden="true">
      <span class="dot" /><span class="dot" /><span class="dot" />
      <span class="tab">~/app</span>
    </div>
    <div class="body">
      <p class="cmd">
        <span class="prompt">$</span>{{ typed }}<span v-if="!done" class="caret">▋</span>
      </p>

      <p class="status" :class="{ on: scanning }">{{ SPIN[spin] }} scanning 47 files…</p>

      <template v-for="(f, i) in findings" :key="f.rule">
        <p class="find" :class="{ on: i < revealed }">
          <span class="chip" :class="'c-' + f.sev">{{ f.label }}</span>
          <span class="rule">{{ f.rule }}</span>
          <span class="loc">{{ f.loc }}</span>
        </p>
      </template>

      <p class="sum" :class="{ on: done }">
        <span class="ok">✔</span> 3 issues · 1 high · scanned in 1.7s
      </p>
    </div>
  </div>
</template>

<style scoped>
.term {
  width: 100%;
  max-width: 520px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: #0b0e16;
  box-shadow:
    0 1px 1px rgba(8, 6, 26, 0.4),
    0 24px 50px -16px rgba(6, 10, 30, 0.55);
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  text-align: left;
}
.bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #12161f;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.dot { width: 11px; height: 11px; border-radius: 50%; }
.dot:nth-child(1) { background: #ff5f57; }
.dot:nth-child(2) { background: #febc2e; }
.dot:nth-child(3) { background: #28c840; }
.tab { margin-left: 10px; color: #626b85; font-size: 12px; }

.body {
  padding: 20px 20px 22px;
  color: #c2cae0;
  font-size: 13px;
  line-height: 1.5;
  min-height: 232px;
}
.body p { margin: 0; }

.cmd { color: #eef1f9; margin-bottom: 14px; }
.prompt { color: var(--vp-c-brand-1); margin-right: 12px; font-weight: 700; }
.caret { color: var(--vp-c-brand-1); animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }

.status {
  color: #8a93af;
  height: 0;
  opacity: 0;
  overflow: hidden;
  transition: opacity 0.2s ease;
}
.status.on { height: auto; opacity: 1; margin-bottom: 6px; }

.find {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 12px;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.find.on { opacity: 1; transform: none; }
.chip {
  font-weight: 700;
  font-size: 9.5px;
  letter-spacing: 0.06em;
  padding: 3px 7px;
  border-radius: 5px;
  flex-shrink: 0;
}
.c-error { color: var(--sev-error); background: color-mix(in srgb, var(--sev-error) 16%, transparent); }
.c-high { color: var(--sev-high); background: color-mix(in srgb, var(--sev-high) 16%, transparent); }
.c-warn { color: var(--sev-warn); background: color-mix(in srgb, var(--sev-warn) 16%, transparent); }
.rule { color: #eef1f9; }
.loc { color: #626b85; margin-left: auto; }

.sum {
  margin-top: 6px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  color: #8a93af;
  font-variant-numeric: tabular-nums;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.sum.on { opacity: 1; }
.ok { color: #28c840; margin-right: 8px; }

@media (max-width: 640px) {
  .term { max-width: 100%; }
  .body { font-size: 12px; padding: 18px 16px; min-height: 220px; }
  .loc { font-size: 11px; }
}
</style>
