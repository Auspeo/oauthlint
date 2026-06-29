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
#   $8  annotations — "true" to emit inline PR annotations + a job summary
#   $9  html        — "true" to also write a self-contained HTML report
#   $10 html-file   — HTML output path (when html=true)
#
# New args are appended at the END so existing positions ($1..$8) never shift.
set -euo pipefail

PATH_TO_SCAN="${1:-.}"
SEVERITY="${2:-}"
FAIL_ON="${3:-HIGH}"
EMIT_JSON="${4:-false}"
OUTPUT_PATH="${5:-oauthlint-report.json}"
EMIT_SARIF="${6:-false}"
SARIF_PATH="${7:-oauthlint.sarif}"
EMIT_ANNOTATIONS="${8:-true}"
EMIT_HTML="${9:-false}"
HTML_PATH="${10:-oauthlint-report.html}"

# Directory of this script, so we can locate the annotate helper regardless of cwd.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "${GITHUB_WORKSPACE:-/github/workspace}"

echo "::group::OAuthLint setup"
echo "node $(node --version)"
echo "semgrep $(semgrep --version)"
echo "oauthlint $(oauthlint --version)"
echo "::endgroup::"

ARGS=( scan "$PATH_TO_SCAN" --fail-on "$FAIL_ON" )
if [[ -n "$SEVERITY" ]]; then
  ARGS+=( --severity "$SEVERITY" )
fi

echo "::group::Running oauthlint ${ARGS[*]}"
# We let exit-code propagate so the action fails when OAuthLint fails.
set +e
oauthlint "${ARGS[@]}"
EXIT_CODE=$?
set -e
echo "::endgroup::"

if [[ "$EMIT_JSON" == "true" ]]; then
  echo "::group::Generating JSON report"
  set +e
  oauthlint scan "$PATH_TO_SCAN" --json --fail-on off > "$OUTPUT_PATH"
  set -e
  echo "Report written to $OUTPUT_PATH"

  # The report path is passed as an argv entry (after `--`) and read via
  # process.argv — never interpolated into the JS source — so a crafted path
  # can't break out of the string and run arbitrary code in the runner.
  FINDINGS=$(node -e 'const p=process.argv[1];console.log(JSON.parse(require("fs").readFileSync(p,"utf8")).findings.length)' -- "$OUTPUT_PATH")
  HIGHEST=$(node -e '
    const fs=require("fs");
    const order=["INFO","LOW","MEDIUM","HIGH","CRITICAL"];
    const p=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
    let h="";
    for(const f of p.findings){ if(order.indexOf(f.severity)>order.indexOf(h)) h=f.severity; }
    console.log(h||"NONE");
  ' -- "$OUTPUT_PATH")
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
  oauthlint "${SARIF_ARGS[@]}" > "$SARIF_PATH"
  set -e
  echo "SARIF report written to $SARIF_PATH"
  echo "sarif-file=$SARIF_PATH" >> "$GITHUB_OUTPUT"
  echo "::endgroup::"
fi

if [[ "$EMIT_HTML" == "true" ]]; then
  echo "::group::Generating HTML report"
  # The HTML report is a shareable audit artifact, not a gate: --fail-on off and
  # we swallow the exit code so this extra pass can never fail the job.
  HTML_ARGS=( scan "$PATH_TO_SCAN" --format html --fail-on off )
  if [[ -n "$SEVERITY" ]]; then
    HTML_ARGS+=( --severity "$SEVERITY" )
  fi
  set +e
  oauthlint "${HTML_ARGS[@]}" > "$HTML_PATH"
  set -e
  echo "HTML report written to $HTML_PATH"
  echo "html-file=$HTML_PATH" >> "$GITHUB_OUTPUT"
  echo "::endgroup::"
fi

if [[ "$EMIT_ANNOTATIONS" == "true" ]]; then
  echo "::group::Emitting annotations + job summary"
  # Reuse the JSON report when json=true; otherwise produce one in a temp file
  # so we never touch the user's workspace or alter the json/output contract.
  ANNOTATE_JSON="$OUTPUT_PATH"
  CLEANUP_JSON=""
  if [[ "$EMIT_JSON" != "true" ]]; then
    ANNOTATE_JSON="$(mktemp "${TMPDIR:-/tmp}/oauthlint-annotate.XXXXXX")"
    CLEANUP_JSON="$ANNOTATE_JSON"
    # --fail-on off + swallow the exit code: annotations must never fail the job.
    ANN_ARGS=( scan "$PATH_TO_SCAN" --json --fail-on off )
    if [[ -n "$SEVERITY" ]]; then
      ANN_ARGS+=( --severity "$SEVERITY" )
    fi
    set +e
    oauthlint "${ANN_ARGS[@]}" > "$ANNOTATE_JSON"
    set -e
  fi
  # The helper prints annotation workflow-commands to stdout and appends the
  # Markdown summary to $GITHUB_STEP_SUMMARY. It is defensive about a missing or
  # malformed report and never exits non-zero, so it can't gate the job.
  set +e
  node "$SCRIPT_DIR/annotate.mjs" "$ANNOTATE_JSON"
  set -e
  [[ -n "$CLEANUP_JSON" ]] && rm -f "$CLEANUP_JSON"
  echo "::endgroup::"
fi

exit "$EXIT_CODE"
