#!/usr/bin/env bash
# OAuthLint GitHub Action entrypoint.
#
# Arguments (in order):
#   $1  path        — directory to scan (default: ".")
#   $2  severity    — minimum severity to emit ("" means all)
#   $3  fail-on     — severity at which the action should fail
#   $4  json        — "true" to also write JSON
#   $5  output      — JSON output path (when json=true)
#   $6  sarif       — "true" to also write a SARIF 2.1.0 report
#   $7  sarif-file  — SARIF output path (when sarif=true)
set -euo pipefail

PATH_TO_SCAN="${1:-.}"
SEVERITY="${2:-}"
FAIL_ON="${3:-HIGH}"
EMIT_JSON="${4:-false}"
OUTPUT_PATH="${5:-oauthlint-report.json}"
EMIT_SARIF="${6:-false}"
SARIF_PATH="${7:-oauthlint.sarif}"

cd "${GITHUB_WORKSPACE:-/github/workspace}"

echo "::group::OAuthLint setup"
echo "node $(node --version)"
echo "semgrep $(semgrep --version)"
echo "::endgroup::"

ARGS=( scan "$PATH_TO_SCAN" --fail-on "$FAIL_ON" )
if [[ -n "$SEVERITY" ]]; then
  ARGS+=( --severity "$SEVERITY" )
fi

echo "::group::Running oauthlint ${ARGS[*]}"
# We let exit-code propagate so the action fails when OAuthLint fails.
set +e
npx --yes oauthlint "${ARGS[@]}"
EXIT_CODE=$?
set -e
echo "::endgroup::"

if [[ "$EMIT_JSON" == "true" ]]; then
  echo "::group::Generating JSON report"
  set +e
  npx --yes oauthlint scan "$PATH_TO_SCAN" --json --fail-on off > "$OUTPUT_PATH"
  set -e
  echo "Report written to $OUTPUT_PATH"

  FINDINGS=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$OUTPUT_PATH','utf8')).findings.length)")
  HIGHEST=$(node -e "
    const fs=require('fs');
    const order=['INFO','LOW','MEDIUM','HIGH','CRITICAL'];
    const p=JSON.parse(fs.readFileSync('$OUTPUT_PATH','utf8'));
    let h='';
    for(const f of p.findings){ if(order.indexOf(f.severity)>order.indexOf(h)) h=f.severity; }
    console.log(h||'NONE');
  ")
  echo "findings=$FINDINGS" >> "$GITHUB_OUTPUT"
  echo "highest-severity=$HIGHEST" >> "$GITHUB_OUTPUT"
  echo "::endgroup::"
else
  echo "findings=0" >> "$GITHUB_OUTPUT"
  echo "highest-severity=NONE" >> "$GITHUB_OUTPUT"
fi

if [[ "$EMIT_SARIF" == "true" ]]; then
  echo "::group::Generating SARIF report"
  # SARIF is for upload to Code Scanning, not for gating: --fail-on off and we
  # swallow the exit code so this extra pass can never fail the job.
  SARIF_ARGS=( scan "$PATH_TO_SCAN" --format sarif --fail-on off )
  if [[ -n "$SEVERITY" ]]; then
    SARIF_ARGS+=( --severity "$SEVERITY" )
  fi
  set +e
  npx --yes oauthlint "${SARIF_ARGS[@]}" > "$SARIF_PATH"
  set -e
  echo "SARIF report written to $SARIF_PATH"
  echo "sarif-file=$SARIF_PATH" >> "$GITHUB_OUTPUT"
  echo "::endgroup::"
fi

exit "$EXIT_CODE"
