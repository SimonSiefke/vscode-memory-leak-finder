import { expect, test } from '@jest/globals'
import { cleanSource } from '../src/parts/CleanSource/CleanSource.ts'

test('cleanSource', () => {
  const input = '/test/repos/vscode/src/vs/workbench/services/untitled/common/untitledTextEditorInput.ts'
  expect(cleanSource(input)).toBe('src/vs/workbench/services/untitled/common/untitledTextEditorInput.ts')
})

test('cleanSource - markdown language features', () => {
  const input = 'webpack://markdown-language-features/./node_modules/@microsoft/applicationinsights-common/dist-es5/ThrottleMgr.js'
  expect(cleanSource(input)).toBe(
    'extensions/markdown-language-features/node_modules/@microsoft/applicationinsights-common/dist-es5/ThrottleMgr.js',
  )
})

test('cleanSource - external commonjs vscode', () => {
  const input = 'webpack://markdown-language-features/external commonjs "vscode"'
  expect(cleanSource(input)).toBe('extensions/markdown-language-features/external/commonjs/vscode')
})

test('cleanSource - odd relative path', () => {
  const input = './file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/lazy.ts'
  expect(cleanSource(input)).toBe('src/vs/base/common/lazy.ts')
})

test('cleanSource - up a folder relative path', () => {
  const input = '../src/eventEmitter2.ts'
  expect(cleanSource(input)).toBe('src/eventEmitter2.ts')
})

test('cleanSource - up a folder .src path', () => {
  const input = '../.src/vs/nls.ts'
  expect(cleanSource(input)).toBe('src/vs/nls.ts')
})

test('cleanSource - node modules path outside source root', () => {
  const input = '../../node_modules/.pnpm/@sentry+utils@8.28.0/node_modules/@sentry/utils/build/esm/is.js'
  expect(cleanSource(input)).toBe('node_modules/.pnpm/@sentry+utils@8.28.0/node_modules/@sentry/utils/build/esm/is.js')
})

test('cleanSource - absolute mixed relative path', () => {
  const input = '/tmp/project/../../node_modules/pkg/index.js'
  expect(cleanSource(input)).toBe('tmp/project/node_modules/pkg/index.js')
})

test('cleanSource - windows mixed relative path', () => {
  const input = 'C:\\tmp\\project\\..\\node_modules\\pkg\\index.js'
  expect(cleanSource(input)).toBe('tmp/project/node_modules/pkg/index.js')
})
