# Branch Protection Configuration

This document describes the required branch protection settings to make the "Run Tests" action mandatory for approving pull requests.

## Required Status Check

The repository has a GitHub Actions workflow called "Run Tests" (`.github/workflows/test.yml`) that runs on all pull requests targeting the `main` or `master` branches. This workflow must pass before a PR can be merged.

### Status Check Details

- **Workflow Name**: Run Tests
- **Job Name**: test
- **Status Check Context**: `test (20.x)`

## Configuration Methods

### Method 1: Using GitHub Repository Rulesets (Recommended)

Repository rulesets are the modern approach to branch protection and can be configured through:

1. Go to repository **Settings** → **Rules** → **Rulesets**
2. Click **New ruleset** → **New branch ruleset**
3. Configure the ruleset:
   - **Name**: "Require Tests to Pass"
   - **Enforcement status**: Active
   - **Target branches**: Default branch (master)
   - **Branch protections**:
     - Enable "Require status checks to pass"
     - Add required check: `test (20.x)`
     - Optional: Enable "Require branches to be up to date before merging"
4. Click **Create**

### Method 2: Using Branch Protection Rules (Classic)

Alternatively, you can use the classic branch protection interface:

1. Go to repository **Settings** → **Branches**
2. Click **Add rule** or edit the existing rule for `master`
3. Configure protection:
   - **Branch name pattern**: `master`
   - Check **Require status checks to pass before merging**
   - Search for and select: `test (20.x)`
   - Optional: Check **Require branches to be up to date before merging**
4. Click **Create** or **Save changes**

### Method 3: Using GitHub CLI (for administrators)

If you have admin access and want to automate this configuration, you can use the script in `.github/scripts/setup-branch-protection.sh`.

## Verification

After configuration, you can verify by:

1. Creating a test pull request
2. Checking that the "test (20.x)" status check appears as required
3. Verifying that the merge button is disabled until tests pass

## Current Workflow

The test workflow runs the following:
- Installs Node.js dependencies
- Runs test suite with `npm test -- --run`
- Builds the project with `npm run build`

All steps must complete successfully for the status check to pass.
