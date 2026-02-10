#!/bin/bash

# Script to set up branch protection requiring tests to pass
# This script requires admin access to the repository
# Usage: ./setup-branch-protection.sh [owner] [repo] [branch]

set -e

# Default values
OWNER="${1:-sauvail}"
REPO="${2:-jdrPrep}"
BRANCH="${3:-master}"

echo "Setting up branch protection for ${OWNER}/${REPO}:${BRANCH}"
echo "This will require the 'test (20.x)' status check to pass before merging PRs"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI"
    echo "Run: gh auth login"
    exit 1
fi

echo "Checking current branch protection..."
CURRENT_PROTECTION=$(gh api "repos/${OWNER}/${REPO}/branches/${BRANCH}/protection" 2>/dev/null || echo "none")

if [ "$CURRENT_PROTECTION" = "none" ]; then
    echo "No existing branch protection found. Creating new protection rules..."
else
    echo "Existing branch protection found. Updating..."
fi

# Update branch protection to require status checks
echo "Enabling required status checks..."
gh api -X PUT "repos/${OWNER}/${REPO}/branches/${BRANCH}/protection" \
    --input - << 'EOF'
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["test (20.x)"]
  },
  "enforce_admins": null,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Branch protection successfully configured!"
    echo "  - Required status check: test (20.x)"
    echo "  - All PRs must pass tests before merging"
    echo ""
    echo "You can view the settings at:"
    echo "https://github.com/${OWNER}/${REPO}/settings/branches"
else
    echo ""
    echo "✗ Failed to configure branch protection"
    echo "Please ensure you have admin access to the repository"
    exit 1
fi
