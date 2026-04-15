#!/usr/bin/env bash
# =============================================================================
# HatchQuest Verification Gate
# =============================================================================
# The single command that must pass before any code is declared complete.
# Run from the repo root: bash scripts/verify.sh
#
# Checks in order:
#   1. TypeScript â€” type-check across all workspaces
#   2. Lint       â€” ESLint on frontend
#   3. Tests      â€” full backend test suite (includes content validator)
#   4. Coverage   â€” engine must be exactly 100%
#
# Fails fast: first failure stops the run and exits non-zero.
# A passing run means the code is ready for adversarial review â€” not done.
# =============================================================================

set -euo pipefail

# Colors
C_GREEN='\033[0;32m'
C_RED='\033[0;31m'
C_CYAN='\033[1;36m'
C_YELLOW='\033[1;33m'
C_RESET='\033[0m'

PASS="${C_GREEN}âœ“${C_RESET}"
FAIL="${C_RED}âœ—${C_RESET}"

# Verify we're at the repo root
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  printf "${C_RED}ERROR: Run this script from the HatchQuest repo root.${C_RESET}\n"
  exit 1
fi

printf "\n${C_CYAN}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${C_RESET}\n"
printf "${C_CYAN}  HatchQuest Verification Gate                      ${C_RESET}\n"
printf "${C_CYAN}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${C_RESET}\n\n"

# -----------------------------------------------------------------------------
# 1. TypeScript â€” all workspaces
# -----------------------------------------------------------------------------
printf "${C_CYAN}[1/4] TypeScript â€” all workspaces${C_RESET}\n"
if npm run type-check 2>&1; then
  printf "${PASS} TypeScript clean\n\n"
else
  printf "${FAIL} TypeScript FAILED\n"
  printf "${C_YELLOW}Fix: resolve all type errors before proceeding. No 'any' bypass.${C_RESET}\n"
  exit 1
fi

# -----------------------------------------------------------------------------
# 2. Lint â€” frontend
# -----------------------------------------------------------------------------
printf "${C_CYAN}[2/4] Lint â€” frontend${C_RESET}\n"
if npm run lint --workspace=frontend 2>&1; then
  printf "${PASS} Lint clean\n\n"
else
  printf "${FAIL} Lint FAILED\n"
  printf "${C_YELLOW}Fix: resolve all ESLint errors. No disabled rules without explanation.${C_RESET}\n"
  exit 1
fi

# -----------------------------------------------------------------------------
# 3. Tests â€” backend (all suites)
# -----------------------------------------------------------------------------
printf "${C_CYAN}[3/4] Tests â€” backend${C_RESET}\n"
if npm test --workspace=backend 2>&1; then
  printf "${PASS} All tests passed\n\n"
else
  printf "${FAIL} Tests FAILED\n"
  printf "${C_YELLOW}Fix: every test must pass. No skipping. No .todo stubs on real logic.${C_RESET}\n"
  exit 1
fi

# -----------------------------------------------------------------------------
# 4. Engine coverage â€” must be 100%
# -----------------------------------------------------------------------------
printf "${C_CYAN}[4/4] Engine coverage â€” must be 100%%${C_RESET}\n"

# Temporarily disable exit-on-error so we can capture output even when coverage fails
set +e
COVERAGE_OUT=$(npm run test:coverage --workspace=backend 2>&1)
COVERAGE_EXIT=$?
set -e

printf "%s\n" "$COVERAGE_OUT"

if [ $COVERAGE_EXIT -ne 0 ] || echo "$COVERAGE_OUT" | grep -qE "ERROR.*Coverage"; then
  printf "\n${FAIL} Coverage FAILED\n"
  printf "${C_YELLOW}Fix: engine logic (src/engine/**) must have 100%% coverage on lines, functions, branches, statements.${C_RESET}\n"
  exit 1
fi
printf "${PASS} Coverage at 100%%\n\n"

# -----------------------------------------------------------------------------
# ALL PASSED
# -----------------------------------------------------------------------------
printf "${C_CYAN}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${C_RESET}\n"
printf "${PASS} ${C_GREEN}All checks passed.${C_RESET}\n"
printf "${C_CYAN}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${C_RESET}\n"
printf "\n${C_YELLOW}Reminder: passing checks â‰  done. Run adversarial self-review before declaring complete.${C_RESET}\n\n"
