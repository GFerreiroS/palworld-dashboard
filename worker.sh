#!/bin/sh
set -eu

# Start collector in background
node dist/worker/index.js &

# Start Next.js
exec node server.js
