# Browser tests

End-to-end checks that drive the real game in headless Chromium through `window.__wildkinDebug`.

1. `node scripts/build-local.mjs`
2. `cd dist-local && python3 -m http.server 4173`
3. `node tests/e2e/story.mjs` (or any other file here)

Each script prints PASS/FAIL lines and any page errors. Screenshots go to `tests/e2e/shots/` (git-ignored).
`lib.mjs` loads Playwright from `/opt/npm-tools`; change the import there if Playwright lives elsewhere.
