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
    callStackSize: 11,
  })
  await Editor.goToFile({
    file: 'index.js',
    line: 3,
    column: 0,
  })
  await Editor.showDebugHover({
    expectedTitle: /ƒ setInterval\(callback, repeat, ...args\)/,
  })
}

export const run = async ({ DebugHover }: TestContext): Promise<void> => {
  await DebugHover.expandProperty('prototype', ['constructor', '[[Prototype]]'])
  await DebugHover.collapseProperty('prototype')
}

export const teardown = async ({ RunAndDebug, Editor }: TestContext): Promise<void> => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
