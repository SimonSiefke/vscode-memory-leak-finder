import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Editor, Workspace, Explorer  }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.js',
      content: `const add = (a, b) => {
  return a + b
}

setInterval(()=>{
  add(1, 2)
}, 1000)`,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.js')
  await Editor.open('index.js')
}

export const run = async ({  ActivityBar, Explorer, RunAndDebug  }: TestContext): Promise<void> => {
  await Explorer.focus()
  await ActivityBar.showRunAndDebug()
  await RunAndDebug.startRunAndDebug()
  await RunAndDebug.stop()
  await Explorer.focus()
}
