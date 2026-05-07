import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

const workspacePath = join(import.meta.dirname, '..', '..', '..', '.vscode-test-workspace')
const generatedFiles = ['index.html', 'index.css', 'index.js'] as const

const prompt = `Inspect the current workspace first, then create a browser-based maze visualization with A* path finding. Use exactly these file names: index.html, index.css, and index.js. Write the files into the workspace instead of replying with code blocks. The page should render a maze, visualize the search, and let the user start or restart the path finding.`

const allFilesExist = () => {
  return generatedFiles.every((fileName) => existsSync(join(workspacePath, fileName)))
}

const waitForGeneratedFiles = async (ChatEditor: TestContext['ChatEditor']): Promise<void> => {
  const maxWaitTime = 180_000
  const pollInterval = 500
  const startTime = performance.now()

  while (performance.now() - startTime < maxWaitTime) {
    await ChatEditor.approveAllAccessRequests()
    if (allFilesExist()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  throw new Error(`Timed out waiting for ${generatedFiles.join(', ')} to be created`)
}

export const setup = async ({ ChatEditor, Editor, Electron, Workspace }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Workspace.setFiles([])
  await Editor.closeAll()
  await ChatEditor.open()
  await ChatEditor.clearAll()
}

export const run = async ({ ChatEditor, Editor, Workspace }: TestContext): Promise<void> => {
  await ChatEditor.setMode('Edit')
  await ChatEditor.send({
    message: prompt,
    model: 'GPT-4.1',
  })

  await waitForGeneratedFiles(ChatEditor)
  await ChatEditor.approveAllAccessRequests()
  await ChatEditor.waitForLatestExchange(prompt)

  for (const fileName of generatedFiles) {
    await Workspace.waitForFile(fileName)
    if (!existsSync(join(workspacePath, fileName))) {
      throw new Error(`Expected ${fileName} to exist in the workspace`)
    }
  }

  await Editor.closeAll()
  await Workspace.setFiles([])
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
}
