import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace, Explorer, RunAndDebug }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.js',
      content: `let x = 1

setInterval(()=>{
  x++
  x++
}, 1000)`,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.js')
  await RunAndDebug.removeAllBreakpoints()
}

export const run = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await Editor.open('index.js')
  await Editor.setBreakpoint(4)
  await RunAndDebug.runAndWaitForPaused()
  await RunAndDebug.step('index.js', 5)
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
