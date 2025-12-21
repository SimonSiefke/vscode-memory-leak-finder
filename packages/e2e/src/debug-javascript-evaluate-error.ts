import type { TestContext } from '../types.ts'

export const skip = true

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
  await Editor.setBreakpoint(4)
  await RunAndDebug.runAndWaitForPaused({
    file: 'index.js',
    line: 4,
  })
}

export const run = async ({ DebugConsole }: TestContext): Promise<void> => {
  await DebugConsole.evaluate({
    expectedResult: {
      message: /Uncaught ReferenceError ReferenceError: glob is not defined/,
      type: 'error',
    },
    expression: 'glob',
  })
  await DebugConsole.clear()
}

export const teardown = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
