import type { TestContext } from '../types.js'

export const skip = false

export const requiresNetwork = true

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

export const setup = async ({ ChatEditor, Editor, Electron, Extensions, SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Extensions.install({
    id: 'GitHub.copilot-chat',
    name: 'GitHub Copilot Chat',
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
  await ChatEditor.clearAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor, Terminal, Workspace }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message:
      'Run node confirm.js in the terminal. The script will pause briefly before it asks for confirmation. If it needs input, answer y and wait until it finishes successfully.',
    verify: true,
  })

  const completed = await Workspace.waitForFile('completed.txt')
  if (!completed) {
    throw new Error('Timed out waiting for completed.txt to be created')
  }

  await Terminal.show()
  await Terminal.shouldContainText('Continue? (y/n)')
  await Terminal.shouldContainText('Script finished successfully')
  await Terminal.shouldHaveSuccessDecoration()
}

export const teardown = async ({ ChatEditor, Editor, Terminal, Workspace }: TestContext): Promise<void> => {
  await ChatEditor.clearAll()
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}