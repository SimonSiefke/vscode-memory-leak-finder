import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

test('pathPlaceholders - normalizes separators when saving and restoring windows paths', async () => {
  const windowsRoot = 'D:\\a\\vscode-memory-leak-finder\\vscode-memory-leak-finder'

  jest.unstable_mockModule('node:path', () => ({
    join: (...parts: readonly string[]) => parts.join('\\'),
    sep: '\\',
  }))
  jest.unstable_mockModule('../src/parts/Root/Root.ts', () => ({
    root: windowsRoot,
  }))

  const PathPlaceholders = await import('../src/parts/PathPlaceholders/PathPlaceholders.ts')

  expect(
    PathPlaceholders.replaceAbsolutePathsWithPlaceholdersInText(
      'D:\\a\\vscode-memory-leak-finder\\vscode-memory-leak-finder\\.vscode-test-workspace\\test\\add.test.js',
    ),
  ).toBe('@@WORKSPACE_PATH@@/test/add.test.js')
  expect(PathPlaceholders.restoreAbsolutePathsFromPlaceholdersInText('@@WORKSPACE_PATH@@/test/add.test.js')).toBe(
    'D:\\a\\vscode-memory-leak-finder\\vscode-memory-leak-finder\\.vscode-test-workspace\\test\\add.test.js',
  )
})
