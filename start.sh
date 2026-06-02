#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/backend"
exec npm run start:prod
