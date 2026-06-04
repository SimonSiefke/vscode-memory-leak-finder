import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from '../types.js'

export const skip = false

export const requiresNetwork = true

const workspacePath = join(import.meta.dirname, '..', '..', '..', '.vscode-test-workspace')
const indexHtmlPath = join(workspacePath, 'index.html')
const appUrl = 'http://localhost:3001'
const expectedInitialTodoText = 'Ship this todo app'

const prompt = `Build a small todo app using plain HTML, CSS, and JavaScript in the current workspace. Use a single page served at http://localhost:3001 and enable auto approval for any commands you need to run. The app must include:
- an h1 with the exact text "Todo App"
- a div with id="todo-list"
- an initial todo item with the exact text "${expectedInitialTodoText}"
- an input with id="todo-input"
- a button with id="add-todo-button" and the exact text "Add Todo"

Create index.html in the workspace. Inline CSS and JavaScript are fine. Start the server on localhost:3001 from the workspace and finish only after the server is running.`

const assertIndexHtmlContainsExpectedSelectors = (): void => {
  const indexHtmlContent = readFileSync(indexHtmlPath, 'utf8')
  if (!indexHtmlContent.includes('id="todo-list"')) {
    throw new Error('Expected index.html to include a #todo-list element')
  }
  if (!indexHtmlContent.includes('id="todo-input"')) {
    throw new Error('Expected index.html to include a #todo-input element')
  }
  if (!indexHtmlContent.includes('id="add-todo-button"')) {
    throw new Error('Expected index.html to include a #add-todo-button element')
  }
  if (!indexHtmlContent.includes(expectedInitialTodoText)) {
    throw new Error(`Expected index.html to include the initial todo text "${expectedInitialTodoText}"`)
  }
}

export const setup = async ({ ChatEditor, Editor, SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await SideBar.hide()
  await Workspace.setFiles([])
  await Terminal.killAll()
  await Editor.closeAll()
  await ChatEditor.open()
  await ChatEditor.clearAll()
}

export const run = async ({ ChatEditor, Editor, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await ChatEditor.setMode('Agent')

  await ChatEditor.sendMessage({
    approveToolCalls: true,
    message: prompt,
    model: 'GPT-4.1',
    verify: true,
    waitForFileChanges: ['index.html'],
    waitForPorts: [3001],
  })

  await Workspace.waitForFile('index.html')
  assertIndexHtmlContainsExpectedSelectors()

  await SimpleBrowser.show({
    url: appUrl,
  })

  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Todo App',
  })
  await SimpleBrowser.shouldHaveText({
    selector: '#todo-list',
    text: expectedInitialTodoText,
  })
  await SimpleBrowser.shouldHaveText({
    selector: '#add-todo-button',
    text: 'Add Todo',
  })

  await Editor.closeAll()
}

export const teardown = async ({ Editor, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
