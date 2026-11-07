#!/bin/sh
# Stitches the parts in src/ into one playable index.html.
# Every .js part shares a single <script type="module"> scope, so order matters (files are concatenated by name).
set -e
cd "$(dirname "$0")"

{
  echo '<!doctype html>'
  echo '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  cat src/00_head.html src/0*.js src/99_tail.html
  echo '</html>'
} > index.html
echo "Built index.html"

# Optional syntax check when Node.js is installed
if command -v node >/dev/null 2>&1; then
  tmp="${TMPDIR:-/tmp}/exorcise-routine-check.mjs"
  cat src/0*.js > "$tmp"
  node --check "$tmp" && echo "Syntax OK"
  rm -f "$tmp"
fi
