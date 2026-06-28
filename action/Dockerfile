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

# Install the CLI into the image and run it directly (not via npx at scan time).
# npx resolves against the *scanned* repo, which breaks when that repo has its own
# package.json named "oauthlint" or a non-npm .npmrc (e.g. a pnpm workspace). A
# global install is isolated from the scanned project entirely. Pinned at build,
# refreshed whenever the action image is rebuilt (i.e. each action release).
RUN npm install -g oauthlint

WORKDIR /action

COPY entrypoint.sh /action/entrypoint.sh
COPY annotate.mjs /action/annotate.mjs
RUN chmod +x /action/entrypoint.sh

ENTRYPOINT ["/action/entrypoint.sh"]
