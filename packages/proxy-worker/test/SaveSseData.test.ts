import { afterEach, expect, test } from '@jest/globals'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import * as ProxyState from '../src/parts/ProxyState/ProxyState.ts'
import * as Root from '../src/parts/Root/Root.ts'
import * as SaveSseData from '../src/parts/SaveSseData/SaveSseData.ts'

const testFolderName = 'proxy-test-save-sse-data'

afterEach(async () => {
  ProxyState.setTestFolderName('')
  await rm(join(Root.root, '.vscode-sse-data', testFolderName), { force: true, recursive: true })
})

test('saveSseData - replaces absolute workspace paths with placeholders', async () => {
  ProxyState.setTestFolderName(testFolderName)
  const workspaceFilePath = join(Root.root, '.vscode-test-workspace', 'test', 'add.test.js')

  const filePath = await SaveSseData.saveSseData(Buffer.from(`data: ${workspaceFilePath}\n\n`, 'utf8'), 'https://example.com/sse', 123)
  const content = await readFile(filePath, 'utf8')

  expect(content).toBe('data: @@WORKSPACE_PATH@@/test/add.test.js\n\n')
})
