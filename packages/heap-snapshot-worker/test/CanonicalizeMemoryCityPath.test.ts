import { expect, test } from '@jest/globals'
import { canonicalizeMemoryCityPath } from '../src/parts/CanonicalizeMemoryCityPath/CanonicalizeMemoryCityPath.ts'

test.each([
  ['file:///work/vscode/src/vs/editor/common/model.ts', 'src/vs/editor/common/model.ts'],
  ['C:\\work\\vscode\\src\\vs\\workbench\\workbench.ts', 'src/vs/workbench/workbench.ts'],
  ['webpack:///./src/vs/base/common/lifecycle.ts?abc', 'src/vs/base/common/lifecycle.ts'],
  ['/work/vscode/extensions/git/src/main.ts', 'extensions/git/src/main.ts'],
  ['/work/vscode/node_modules/lodash/lodash.js', 'external/node_modules/lodash/lodash.js'],
  ['', 'runtime/unattributed/unknown'],
])('canonicalizes %s', (input, expected) => {
  expect(canonicalizeMemoryCityPath(input)).toBe(expected)
})
