# oauthlint

## 0.1.1

### Patch Changes

- Declare `fast-glob` as a runtime dependency of `oauthlint-rules`. It was a
  devDependency, so standalone installs from npm failed at runtime with
  `ERR_MODULE_NOT_FOUND: Cannot find package 'fast-glob'` (it only resolved in the
  monorepo via hoisting). The CLI bumps too so it depends on the fixed rules.
- Updated dependencies
  - oauthlint-rules@0.1.1
