import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, Editor, Workspace, SideBar, ActivityBar, Explorer }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: `{
  "name": "test-project",
  "version": "1.0.0",
  "type": "module"
}`,
      name: 'package.json',
    },
    {
      content: `import { writeFileSync } from 'node:fs'

writeFileSync('result.txt', 'test result')
`,
      name: 'index.js',
    },
  ])
  await ActivityBar.showExplorer()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('index.js')
  await SideBar.hide()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor, Workspace, Explorer, SideBar, ActivityBar, Terminal }: TestContext): Promise<void> => {
  await ActivityBar.showExplorer()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('index.js')
  await SideBar.hide()
  await Terminal.killAll()
  await ChatEditor.sendMessage({
    message:
      "Please run the index.js file in the terminal using node. Once running the index.js script has finished, read the result txt file normally. Ensure to respond with the contents of result.txt. That's it. Don't use any todo list. Don't create a todo. Under no circumstances use any tool except to run the index.js script and reading the result.txt file.",
    verify: true,
    expectedResponse: 'test result',
    expectedResponseType: 'includes',
    allowances: ['allow'],
  })
  await Workspace.waitForFile('result.txt')
  await ChatEditor.clearAll()
  await Workspace.remove('result.txt')
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.remove('result.txt')
  await Workspace.remove('index.js')
  await Workspace.remove('package.json')
  await Editor.closeAll()
}
