import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ ActivityBar, Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `setInterval(() => {
  console.log('debug lifecycle')
}, 1000)
`,
      name: 'debug-lifecycle.js',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('debug-lifecycle.js')
  await Editor.open('debug-lifecycle.js')
  await ActivityBar.showRunAndDebug()
}

export const run = async ({ RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.startRunAndDebug()
  await RunAndDebug.stop()
}

export const teardown = async ({ Editor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
}
