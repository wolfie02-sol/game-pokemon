#!/bin/sh
# Runs every browser suite against the build served on :4173 and prints one line per suite.
cd "$(dirname "$0")"
for t in story mech gym evo newgame status audit audit2 audit3 tap ui systems p1 mobile exp; do
  out=$(BASE=http://localhost:4173/ timeout 1200 node $t.mjs 2>&1)
  pass=$(printf '%s\n' "$out" | grep -c '^PASS')
  fail=$(printf '%s\n' "$out" | grep -c '^FAIL')
  errs=$(printf '%s\n' "$out" | grep -E '^errors|^\[' | tail -1)
  echo "$t: $pass pass, $fail fail $errs"
  printf '%s\n' "$out" | grep '^FAIL' | head -5
done
