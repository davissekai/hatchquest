#!/usr/bin/env bash
# brie-verify.sh — Brie's personal godslayer gate
#
# Run this before every commit. If it fails, your content has a bug.
# Usage: bash scripts/brie-verify.sh
#
# What it checks:
#   1. TypeScript — backend + shared packages compile clean
#   2. Content validation — 20 rules covering structure, calibration, and logic
#
# Note: does NOT run frontend lint (that's Davis's gate via verify.sh).

set -euo pipefail

CYAN='\033[1;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

# Detect repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [[ ! -f "$ROOT/package.json" ]]; then
  echo "Error: run from the repo root or scripts/ directory." >&2
  exit 1
fi
cd "$ROOT"

echo ""
echo -e "${CYAN}════════════════════════════════════════════════${RESET}"
echo -e "${CYAN}  Brie Verification Gate                        ${RESET}"
echo -e "${CYAN}════════════════════════════════════════════════${RESET}"
echo ""

# ── Step 1: TypeScript ────────────────────────────────────────────────────────

echo -e "${CYAN}[1/2] TypeScript — backend + shared${RESET}"

npm run type-check --workspace=backend 2>&1
npm run type-check --workspace=packages/shared 2>&1

echo -e "${GREEN}✓${RESET} TypeScript clean"
echo ""

# ── Step 2: Content validation tests ─────────────────────────────────────────

echo -e "${CYAN}[2/2] Content validation — 20 rules${RESET}"

set +e
CONTENT_OUT=$(npm test --workspace=backend -- \
  --reporter=verbose \
  "src/__tests__/content-validation.test.ts" 2>&1)
CONTENT_EXIT=$?
set -e

echo "$CONTENT_OUT"

if [[ $CONTENT_EXIT -ne 0 ]]; then
  echo ""
  echo -e "${RED}✗ Content validation failed — your node has a bug.${RESET}"
  echo ""
  echo "  Check the failure message above for the exact rule and node ID."
  echo "  Rules reference: docs/brie-world-conditions.md"
  echo "  Test file:       backend/src/__tests__/content-validation.test.ts"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓${RESET} Content validation clean"
echo ""

# ── All clear ─────────────────────────────────────────────────────────────────

echo -e "${CYAN}════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}✓ Brie gate passed. Safe to commit.${RESET}"
echo -e "${CYAN}════════════════════════════════════════════════${RESET}"
echo ""
echo -e "  Remember: passing checks ≠ done."
echo -e "  Before committing, ask yourself:"
echo -e "    • Does every choice have a tension that isn't obvious?"
echo -e "    • Does the bold choice have the biggest upside AND downside?"
echo -e "    • Is the cautious choice meaningfully different from doing nothing?"
echo ""
