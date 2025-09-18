import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

export const setup = async ({  Editor, Workspace, Explorer, RunAndDebug  }: TestContext): Promise<void> => {
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
  await Editor.open('index.js')
  await Editor.setBreakpoint(4)
  await RunAndDebug.runAndWaitForPaused({
    file: 'index.js',
    line: 4,
  })
}

export const run = async ({  RunAndDebug  }: TestContext): Promise<void> => {
  await RunAndDebug.setValue('x', '1', '5')
  await RunAndDebug.setValue('x', '5', '1')
}

export const teardown = async ({  RunAndDebug, Editor  }: TestContext): Promise<void> => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
