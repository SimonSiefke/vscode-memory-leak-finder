import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace, Explorer, RunAndDebug }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'index.js',
      content: `let x = 1

setInterval(()=>{
  x++
}, 1000)`,
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
    expression: 'x',
    expectedResult: {
      type: 'number',
      message: '1',
    },
  })
  await DebugConsole.clear()
}

export const teardown = async ({ RunAndDebug, Editor }: TestContext): Promise<void> => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
