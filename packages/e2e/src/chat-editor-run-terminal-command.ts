import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, Editor, Workspace, SideBar }: TestContext): Promise<void> => {
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
  await SideBar.hide()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor, Workspace }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message:
      "Please run the index.js file in the terminal. Once you are finished. Respond exactly with the output of result.txt, which should be created. Don't write any extra sentence or word. Don\'t write to any files. Also dont use any todo list. Let me be very clear: Do not use the todo list. Just respond with the contents of result.txt",
    verify: true,
    expectedResponse: 'test result',
    expectedResponseType: 'includes',
    allowances: ['allow'],
  })
  await Workspace.waitForFile('result.txt')
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.remove('result.txt')
  await Workspace.remove('index.js')
  await Workspace.remove('package.json')
  await Editor.closeAll()
}
