# This branch

you'll get notified when `#334` merges and when the subsequent changesets "Version Packages" PR is opened/merged in `qualweb/qualweb`.

## Plan recap

- **No action needed now.** Wait for notifications on both PRs.
- **Once the "Version Packages" PR merges** (bumping `@qualweb/playwright-driver`): check `npmjs.com/package/@qualweb/playwright-driver` for the new patch version, then bump it in `@/Users/pool/Documents/Topics/repos/a11yTesting/testaro/package.json`.
- **Re-test**: run a job with a `qualWeb` act and confirm the `No DOM` error is gone before merging your `qwpw` branch.

I'll be ready to help with the dependency bump and verification when that release lands.
