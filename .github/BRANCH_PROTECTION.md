## Branch Protection Strategy

This project uses GitHub branch protection and CI to prevent breaking changes from being merged into `main`.

### Protected Branches

- **Protected branch**: `main`

### Required Status Checks

- **Require status checks to pass before merging**: **Enabled**
- **Required checks**:
  - `Frontend CI` (workflow in `.github/workflows/frontend-ci.yml`)
- **Require branches to be up to date before merging**: **Enabled**

### Pull Request Requirements

- **Require a pull request before merging**: **Enabled**
- **Required approvals**: **At least 1 reviewer**
- **Allow self-approval**: **Disabled (recommended)**
- **Dismiss stale pull request approvals when new commits are pushed**: **Enabled**
- **Require conversation resolution before merging**: **Enabled**

### Tests and Coverage

- **Tests required for merge**: **Yes, where tests exist**
  - `npm test` is executed in CI if a `test` script is present in `package.json`.
  - Test failures **block merges** because they fail the `Frontend CI` workflow.
- **Coverage thresholds**: Not enforced yet.
  - Future work: add coverage reporting (e.g. Jest/Vitest coverage or Codecov) and enforce minimum thresholds when the test suite is stable.

### Handling Failed Checks

- **Failed CI checks block merges**: **Yes (recommended and assumed here)**
  - Lint errors
  - TypeScript errors
  - Test failures
  - Build failures

Developers should fix issues locally before re-running CI:

- `npm run lint`
- `npm run type-check`
- `npm test`
- `npm run build`

### Optional: Pre-commit Hooks with Husky

Pre-commit hooks are recommended to catch issues earlier but are **not required** by this configuration.

If you decide to use Husky:

1. Install Husky and lint-staged:
   - `npm install --save-dev husky lint-staged`
2. Enable Husky:
   - `npx husky init`
3. Configure a minimal `pre-commit` hook to keep it fast, for example:

   ```bash
   npx lint-staged
   ```

4. Example `package.json` additions (conceptual, adapt to your setup):

   ```json
   {
     "lint-staged": {
       "*.{ts,tsx,js,jsx}": "eslint --fix"
     },
     "scripts": {
       "type-check": "tsc --noEmit"
     }
   }
   ```

You can also add a **pre-push** hook to run `npm run type-check` or a fast subset of tests, but keep it lightweight to avoid blocking developer workflows.

