import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from '../types.js'

export const skip = false

export const requiresNetwork = true

const workspacePath = join(import.meta.dirname, '..', '..', '..', '.vscode-test-workspace')
const indexHtmlPath = join(workspacePath, 'index.html')
const expectedInitialTodoText = 'Ship this todo app'
const appPort = 3001
const appUrl = `http://localhost:${appPort}`

const prompt = `Build a small todo app using plain HTML, CSS, and JavaScript in the exact workspace directory ${workspacePath}. Do not create or modify files outside ${workspacePath}. Use a single page served at ${appUrl} and enable auto approval for any commands you need to run. The app must include:
- an h1 with the exact text "Todo App"
- a div with id="todo-list"
- an initial todo item with the exact text "${expectedInitialTodoText}"
- an input with id="todo-input"
- a button with id="add-todo-button" and the exact text "Add Todo"

Create ${indexHtmlPath}. Inline CSS and JavaScript are fine. Start the server on localhost:${appPort} with ${workspacePath} as its working directory and finish only after the server is running.`

const assertIndexHtmlContainsExpectedSelectors = (): string => {
  const indexHtmlContent = readFileSync(indexHtmlPath, 'utf8')
  if (!indexHtmlContent.includes('id="todo-list"')) {
    return 'Expected index.html to include a #todo-list element'
  }
  if (!indexHtmlContent.includes('id="todo-input"')) {
    return 'Expected index.html to include a #todo-input element'
  }
  if (!indexHtmlContent.includes('id="add-todo-button"')) {
    return 'Expected index.html to include a #add-todo-button element'
  }
  if (!indexHtmlContent.includes(expectedInitialTodoText)) {
    return `Expected index.html to include the initial todo text "${expectedInitialTodoText}"`
  }
  return ''
}

export const setup = async ({ Editor, SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await SideBar.hide()
  await Workspace.setFiles([])
  await Terminal.killAll()
  await Editor.closeAll()
}

export const run = async ({ ChatEditor, Editor, SimpleBrowser, Terminal, Workspace }: TestContext): Promise<void> => {
  await SimpleBrowser.trackPort(appPort)

  await ChatEditor.open()
  await ChatEditor.clearAll()
  await ChatEditor.setMode('Agent')

  await ChatEditor.sendMessage({
    approveToolCalls: true,
    message: prompt,
    model: ChatEditor.Models.Auto,
    viewLinesText: /running\.$/,
    waitForFileChanges: ['index.html'],
    waitForPorts: [appPort],
  })

  await Workspace.waitForFile('index.html')
  const errorMessage = assertIndexHtmlContainsExpectedSelectors()
  if (errorMessage) {
    throw new Error(`Workspace error: ${errorMessage}`)
  }

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

  await SimpleBrowser.killAllPorts()
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}

export const teardown = async ({ Editor, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
