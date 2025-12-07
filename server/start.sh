#!/bin/sh
echo "Starting server (migrations will run on first request)..."
exec node dist/index.js
