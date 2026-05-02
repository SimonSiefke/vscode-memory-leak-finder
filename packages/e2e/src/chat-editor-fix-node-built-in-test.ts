import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { TestContext } from '../types.js'

const workspacePath = join(import.meta.dirname, '..', '..', '..', '.vscode-test-workspace')
const sourceFilePath = join(workspacePath, 'src', 'add.js')
const testFilePath = join(workspacePath, 'test', 'add.test.js')

const sourceFileContent = `export const add = (a, b) => a + b
`

const incorrectAssertion = 'assert.equal(add(1, 2), 4)'

export const skip = 1

export const requiresNetwork = true

const waitForFixedTest = async (ChatEditor: TestContext['ChatEditor']): Promise<void> => {
  const maxWaitTime = 90_000
  const pollInterval = 1_000
  const startTime = performance.now()

  while (performance.now() - startTime < maxWaitTime) {
    await ChatEditor.clickAccessButton()

    const [sourceContent, testContent] = await Promise.all([readFile(sourceFilePath, 'utf8'), readFile(testFilePath, 'utf8')])

    if (sourceContent === sourceFileContent && !testContent.includes(incorrectAssertion)) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  throw new Error('Timed out waiting for the test file to be fixed')
}

export const setup = async ({ ChatEditor, Editor, Electron, Workspace }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  // await Extensions.install({
  //   id: 'GitHub.copilot-chat',
  //   name: 'GitHub Copilot Chat',
  // })

  await Workspace.setFiles([
    {
      name: 'package.json',
      content: `{
  "name": "sample-node-project",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
`,
    },
    {
      name: 'src/add.js',
      content: sourceFileContent,
    },
    {
      name: 'test/add.test.js',
      content: `import assert from 'node:assert/strict'
import test from 'node:test'
import { add } from '../src/add.js'

test('add returns the sum of two numbers', () => {
  assert.equal(add(1, 2), 4)
})
`,
    },
  ])

  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    approveToolCalls: true,
    message: `Run the tests with node --test and fix the failing test. The implementation in src/add.js is already correct, so prefer fixing the test in test/add.test.js.`,
  })

  await waitForFixedTest(ChatEditor)
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
}
