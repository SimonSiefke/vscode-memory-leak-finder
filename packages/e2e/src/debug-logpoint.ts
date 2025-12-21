import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Explorer, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `let x = 1

setInterval(()=>{
  x++
}, 1000)`,
      name: 'index.js',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.js')
  await RunAndDebug.removeAllBreakpoints()
  await Editor.open('index.js')
}

export const run = async ({ ActivityBar, Editor, RunAndDebug }: TestContext): Promise<void> => {
  await Editor.setLogpoint(4, 'x = {x}')
  await ActivityBar.showRunAndDebug()
  // @ts-ignore
  await RunAndDebug.runAndWaitForDebugConsoleOutput({
    output: `x = 1`,
  })
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
}

export const teardown = async ({ Editor, SideBar }: TestContext): Promise<void> => {
  await SideBar.hide()
  await Editor.closeAll()
}
