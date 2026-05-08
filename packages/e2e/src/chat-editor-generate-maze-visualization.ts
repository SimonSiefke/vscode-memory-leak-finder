import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

const workspacePath = join(import.meta.dirname, '..', '..', '..', '.vscode-test-workspace')
const generatedFiles = ['index.html', 'index.css', 'index.js'] as const

const prompt = `Inspect the current workspace first and then use workspace file tools to create a browser-based maze visualization with A* path finding. Use exactly these file names: index.html, index.css, and index.js. Do not reply with code blocks. Write the files into the workspace, asking for approval when needed, and finish by replying with exactly done.`

const allFilesExist = () => {
  return generatedFiles.every((fileName) => existsSync(join(workspacePath, fileName)))
}

const waitForGeneratedFiles = async (ChatEditor: TestContext['ChatEditor']): Promise<void> => {
  const maxWaitTime = 90_000
  const pollInterval = 500
  const startTime = performance.now()

  while (performance.now() - startTime < maxWaitTime) {
    await ChatEditor.approveAllAccessRequests()
    if (allFilesExist()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  const latestResponse = await ChatEditor.getLatestResponseText().catch(() => '')
  const responseSuffix = latestResponse ? ` Latest response: ${latestResponse}` : ''
  throw new Error(`Timed out waiting for ${generatedFiles.join(', ')} to be created.${responseSuffix}`)
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
  try {
    await ChatEditor.setMode('Agent')
  } catch {}

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
