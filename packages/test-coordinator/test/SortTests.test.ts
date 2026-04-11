import { expect, test } from '@jest/globals'
import * as SortTests from '../src/parts/SortTests/SortTests.ts'

test('sortTests sorts test files alphabetically without mutating the input', () => {
  const dirents = ['editor-folding.ts', 'activity-bar-toggle.ts', 'editor-find-widget-toggle.ts']

  const result = SortTests.sortTests(dirents)

  expect(result).toEqual(['activity-bar-toggle.ts', 'editor-find-widget-toggle.ts', 'editor-folding.ts'])
  expect(dirents).toEqual(['editor-folding.ts', 'activity-bar-toggle.ts', 'editor-find-widget-toggle.ts'])
})
