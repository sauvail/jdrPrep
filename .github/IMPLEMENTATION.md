# Making Run Tests Mandatory for PR Approval

## Overview

This PR provides the configuration and documentation needed to make the "Run Tests" GitHub Action mandatory for approving pull requests to the `master` branch.

## Implementation

Since branch protection settings require repository admin permissions to configure, this PR includes:

1. **Documentation** (`.github/BRANCH_PROTECTION.md`): Comprehensive guide with three configuration methods
2. **Automation Script** (`.github/scripts/setup-branch-protection.sh`): Bash script for automated setup

## Quick Setup

### For Repository Administrators

**Option 1: Manual Configuration (via Web UI)**
1. Go to Settings → Rules → Rulesets
2. Create a new branch ruleset
3. Set target to default branch (`master`)
4. Enable "Require status checks to pass"
5. Add required check: `test (20.x)`

**Option 2: Automated Setup (via Script)**
```bash
./.github/scripts/setup-branch-protection.sh
```

## What This Does

Once configured, the repository will:
- ✓ Require the `test (20.x)` status check to pass before merging any PR
- ✓ Prevent merging PRs with failing tests
- ✓ Show clear status in the PR UI indicating test requirements

## Status Check Details

- **Workflow**: `.github/workflows/test.yml`
- **Workflow Name**: Run Tests
- **Job Name**: test
- **Context**: `test (20.x)` (includes Node.js matrix version)

## Verification

After setup, create a test PR and verify:
1. The "test (20.x)" check appears as required
2. Merge button is disabled until tests pass
3. Tests run automatically on PR creation/updates

See `.github/BRANCH_PROTECTION.md` for detailed documentation.
