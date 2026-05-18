import { spawnSync } from 'node:child_process'
import type { TestContext } from '../types.js'

const sourceFileContent = `export const add = (a, b) => a + b
`

export const skip = 1

export const requiresNetwork = true

const waitForFixedTest = async (cwd: string): Promise<void> => {
  const { status, stdout, stderr } = spawnSync(`npm`, ['test'], {
    cwd,
  })
  if (status !== 0) {
    throw new Error(`Tests are still failing. Output:\n${stdout}\n${stderr}`)
  }
}

const initialFiles = [
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
]

export const setup = async ({ ChatEditor, Editor, Workspace, SideBar }: TestContext): Promise<void> => {
  await SideBar.hide()
  await Workspace.setFiles(initialFiles)
  await Editor.closeAll()
  // await ChatEditor.clearAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor, Workspace }: TestContext): Promise<void> => {
  const prompt = `Run the tests with node --test and fix the failing test. The implementation in src/add.js is already correct, so prefer fixing the test in test/add.test.js.`
  await ChatEditor.sendMessage({
    message: prompt,
    verify: true,
    approveToolCalls: true,
  })

  // @ts-ignore
  const workspacePath = Workspace.getPath()
  await waitForFixedTest(workspacePath)
  await Workspace.setFiles(initialFiles)
<<<<<<< HEAD
=======
  await ChatEditor.clearAll()
>>>>>>> origin/main
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
}
