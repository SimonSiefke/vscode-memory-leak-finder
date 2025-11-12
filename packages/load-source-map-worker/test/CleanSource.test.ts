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
