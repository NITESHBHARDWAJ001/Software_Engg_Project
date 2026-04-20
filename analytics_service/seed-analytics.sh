#!/bin/bash
# Quick seed script for analytics service (Linux/macOS)
# Usage: ./seed-analytics.sh
#        ./seed-analytics.sh --reset
#        ./seed-analytics.sh --org-ids org1 org2

set -e

ANALYTICS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_DIR="$(dirname "$(dirname "$ANALYTICS_DIR")")/env"
PYTHON_EXE="$ENV_DIR/bin/python"

if [ ! -f "$PYTHON_EXE" ]; then
    echo "❌ Python executable not found at $PYTHON_EXE"
    exit 1
fi

echo "🚀 Seeding analytics service..."

RESET=""
ORG_IDS=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --reset)
            RESET="--reset"
            echo "  [--reset] Existing data will be cleared"
            shift
            ;;
        --org-ids)
            shift
            while [[ $# -gt 0 && ! "$1" =~ ^-- ]]; do
                ORG_IDS="$ORG_IDS $1"
                shift
            done
            echo "  [--org-ids]$ORG_IDS"
            ;;
        *)
            shift
            ;;
    esac
done

cd "$ANALYTICS_DIR"

if [ -n "$RESET" ] && [ -n "$ORG_IDS" ]; then
    $PYTHON_EXE seed_all_analytics.py $RESET --org-ids $ORG_IDS
elif [ -n "$RESET" ]; then
    $PYTHON_EXE seed_all_analytics.py $RESET
elif [ -n "$ORG_IDS" ]; then
    $PYTHON_EXE seed_all_analytics.py --org-ids $ORG_IDS
else
    $PYTHON_EXE seed_all_analytics.py
fi

echo "✅ Done!"
