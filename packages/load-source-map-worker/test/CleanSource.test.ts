import { expect, test } from '@jest/globals'
import { cleanSource } from '../src/parts/CleanSource/CleanSource.ts'

test('cleanSource', () => {
  const input = '/test/repos/vscode/src/vs/workbench/services/untitled/common/untitledTextEditorInput.ts'
  expect(cleanSource(input)).toBe('src/vs/workbench/services/untitled/common/untitledTextEditorInput.ts')
})
