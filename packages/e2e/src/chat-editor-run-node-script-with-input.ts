import type { TestContext } from '../types.js'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export const skip = false

export const requiresNetwork = true

const workspacePath = join(import.meta.dirname, '..', '..', '..', '.vscode-test-workspace')
const completedFilePath = join(workspacePath, 'completed.txt')

const waitForCompletedFile = async (): Promise<void> => {
  const maxWaitTime = 90_000
  const pollInterval = 1_000
  const startTime = performance.now()

  while (performance.now() - startTime < maxWaitTime) {
    if (existsSync(completedFilePath)) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  throw new Error('Timed out waiting for completed.txt to be created')
}

const scriptContent = `import { writeFile } from 'node:fs/promises'
import { stdin as input, stdout as output } from 'node:process'
import { createInterface } from 'node:readline/promises'

console.log('Preparing confirmation prompt...')
await new Promise((resolve) => setTimeout(resolve, 1500))

const timeout = setTimeout(() => {
  console.error('Timed out waiting for input')
  process.exit(1)
}, 15000)

const rl = createInterface({ input, output })
const answer = await rl.question('Continue? (y/n) ')
clearTimeout(timeout)
rl.close()

if (answer.trim().toLowerCase() !== 'y') {
  console.error(\`Unexpected answer: \${answer}\`)
  process.exit(1)
}

await writeFile('completed.txt', 'done\n')
console.log('Script finished successfully')
`

export const setup = async ({ ChatEditor, Editor, Electron, SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })

  await Workspace.setFiles([
    {
      name: 'package.json',
      content: `{
  "name": "interactive-node-script",
  "private": true,
  "type": "module"
}
`,
    },
    {
      name: 'confirm.js',
      content: scriptContent,
    },
  ])

  await Terminal.killAll()
  await SideBar.hide()
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor, Terminal }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message:
      'Run node confirm.js in the terminal. The script will pause briefly before it asks for confirmation. If it needs input, answer y and wait until it finishes successfully.',
    model: 'GPT-4.1',
    verify: true,
  })

  await waitForCompletedFile()

  const terminalWithText = Terminal as TestContext['Terminal'] & {
    shouldContainText(text: string, timeout?: number): Promise<void>
  }

  await Terminal.show()
  await terminalWithText.shouldContainText('Continue? (y/n)')
  await terminalWithText.shouldContainText('Script finished successfully')
  await Terminal.shouldHaveSuccessDecoration()
}

export const teardown = async ({ Editor, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
