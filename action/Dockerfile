# OAuthLens · OAuthLint GitHub Action runner.
#
# Built on the official Semgrep image so the binary is always available.
# The image installs Node so we can run the @oauthlens/oauthlint CLI from npm
# without bundling it inside the image (avoids stale releases).
FROM semgrep/semgrep:1.163.0

# Semgrep image is Alpine-based; install Node 22 and curl for npx.
RUN apk add --no-cache nodejs=~22 npm=~10 bash ca-certificates

WORKDIR /action

COPY entrypoint.sh /action/entrypoint.sh
COPY annotate.mjs /action/annotate.mjs
RUN chmod +x /action/entrypoint.sh

ENTRYPOINT ["/action/entrypoint.sh"]
