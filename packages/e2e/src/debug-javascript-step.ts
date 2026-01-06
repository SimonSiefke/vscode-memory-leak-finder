import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Explorer, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `let x = 1

setInterval(()=>{
  x++
  x++
}, 1000)`,
      name: 'index.js',
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
  await RunAndDebug.runAndWaitForPaused({
    callStackSize: 11,
    file: 'index.js',
    line: 4,
  })
  // @ts-ignore
  await RunAndDebug.step({
    file: 'index.js',
    line: 5,
  })
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
