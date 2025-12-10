import type { TestContext } from '../types.ts'

export const skip = 1

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
  await Editor.setLogpoint(4, 'x = {x}')
}

export const run = async ({ ActivityBar, RunAndDebug, DebugConsole }: TestContext): Promise<void> => {
  await ActivityBar.showRunAndDebug()
  // @ts-ignore
  await RunAndDebug.runAndWaitForDebugConsoleOutput({
    output: `x = 1`,
  })
  // await DebugConsole.show()
  // await DebugConsole.shouldHaveLogpointOutput('x = 1')
  // await RunAndDebug.stop()
}

export const teardown = async ({ RunAndDebug, Editor }: TestContext): Promise<void> => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
