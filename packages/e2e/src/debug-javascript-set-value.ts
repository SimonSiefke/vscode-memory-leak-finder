import type { TestContext } from '../types.ts'

export const skip = process.platform === 'darwin'

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
  await Editor.open('index.js')
  await Editor.setBreakpoint(4)
  await RunAndDebug.runAndWaitForPaused({
    file: 'index.js',
    line: 4,
  })
}

export const run = async ({ RunAndDebug }: TestContext): Promise<void> => {
  // @ts-ignore
  await RunAndDebug.setValue({ newVariableValue: '5', variableName: 'x', variableValue: '1' })
  // @ts-ignore
  await RunAndDebug.setValue({ newVariableValue: '1', variableName: 'x', variableValue: '5' })
}

export const teardown = async ({ Editor, RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
