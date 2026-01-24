import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `const add = (a, b) => {
  return a + b
}

setInterval(()=>{
  add(1, 2)
}, 1000)`,
      name: 'index.js',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('index.js')
  await Editor.open('index.js')
}

export const run = async ({ ActivityBar, Explorer, RunAndDebug }: TestContext): Promise<void> => {
  await Explorer.focus()
  await ActivityBar.showRunAndDebug()
  await RunAndDebug.startRunAndDebug()
  await RunAndDebug.stop()
  await Explorer.focus()
}

export const teardown = async ({ SideBar, Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
}
