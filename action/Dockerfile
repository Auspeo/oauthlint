# OAuthLint GitHub Action runner.
#
# Built on the official Semgrep image so the binary is always available.
# The image installs Node so we can run the oauthlint CLI from npm at run time
# without bundling it inside the image (avoids stale releases).
FROM semgrep/semgrep:1.163.0

# Semgrep image is Alpine-based; install Node + npm (for npx) and bash.
# Unpinned on purpose: Alpine moves the nodejs/npm major over time, and pinning
# (e.g. nodejs=~22) breaks the build the moment the repo advances. The CLI only
# needs Node >= 20, which any current Alpine nodejs satisfies.
RUN apk add --no-cache nodejs npm bash ca-certificates

WORKDIR /action

COPY entrypoint.sh /action/entrypoint.sh
COPY annotate.mjs /action/annotate.mjs
RUN chmod +x /action/entrypoint.sh

ENTRYPOINT ["/action/entrypoint.sh"]
