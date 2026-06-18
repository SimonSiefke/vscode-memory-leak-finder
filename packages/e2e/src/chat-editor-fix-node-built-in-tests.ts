import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from '../types.js'

const sourceFileContent = `export const add = (a, b) => a + b
`

const failingAdditions = [
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [12, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [16, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [20, 21],
  [21, 22],
  [22, 23],
  [23, 24],
  [24, 25],
  [25, 26],
] as const

const failingTestFiles = failingAdditions.map(([left, right], index) => ({
  content: `import assert from 'node:assert/strict'
import test from 'node:test'
import { add } from '../src/add.js'

test('add returns the sum of ${left} and ${right}', () => {
  assert.equal(add(${left}, ${right}), ${left + right + 1})
})
`,
  name: `test/add-${index + 1}.test.js`,
}))

export const skip = 1

export const requiresNetwork = true

const waitForFixedTest = async (cwd: string): Promise<void> => {
  const { status, stderr, stdout } = spawnSync(`npm`, ['test'], {
    cwd,
  })
  if (status !== 0) {
    throw new Error(`Tests are still failing. Output:\n${stdout}\n${stderr}`)
  }
}

const assertSourceFileUnchanged = (cwd: string): void => {
  const sourceFilePath = join(cwd, 'src/add.js')
  const sourceFile = readFileSync(sourceFilePath, 'utf8')
  if (sourceFile !== sourceFileContent) {
    throw new Error(`Expected src/add.js to remain unchanged, but found:\n${sourceFile}`)
  }
}

const initialFiles = [
  {
    content: `{
  "name": "sample-node-project",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
`,
    name: 'package.json',
  },
  {
    content: sourceFileContent,
    name: 'src/add.js',
  },
  ...failingTestFiles,
]

const prompt = `Run npm test and fix every failing Node built-in test file under test/. The implementation in src/add.js is already correct, so do not change src/add.js unless the tests prove it is wrong. Update all failing test files so npm test passes.`

export const setup = async ({ ChatEditor, Editor, SideBar, Workspace }: TestContext): Promise<void> => {
  await SideBar.hide()
  await Workspace.setFiles(initialFiles)
  await Editor.closeAll()
  await ChatEditor.open()
  // @ts-ignore
  await ChatEditor.selectModel('GPT-5 mini')
}

export const run = async ({ ChatEditor, Workspace }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    approveToolCalls: true,
    message: prompt,
    model: 'GPT-5 mini',
    verify: true,
    waitForFileChanges: failingTestFiles.map((file) => file.name),
  })

  // @ts-ignore
  const workspacePath = Workspace.getPath()
  await waitForFixedTest(workspacePath)
  assertSourceFileUnchanged(workspacePath)
  await Workspace.setFiles(initialFiles)
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
}
