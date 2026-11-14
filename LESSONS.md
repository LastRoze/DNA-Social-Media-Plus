# Lessons - mistakes this workspace must never repeat

## Lessons

- 2026-11-14 Userscript versions follow the owner's MAJOR.MINOR scheme with one minor digit (1.1 ... 1.9, 2.0, 2.1), raised by one step per release, never semver and never a jump -> `node scripts/build.mjs --check` rejects any other `@version` in CI (evidence: 3.0.0 shipped in PR #1; the owner set the current release to 1.1).
