import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Explorer, Extensions, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Extensions.disable({ id: 'copilot' })
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
}

export const run = async ({ ActivityBar, Editor, RunAndDebug }: TestContext): Promise<void> => {
  let debuggerStarted = false
  try {
    await Editor.open('index.js')
    await Editor.setBreakpoint(4)
    await ActivityBar.showRunAndDebug()
    await RunAndDebug.startRunAndDebug()
    debuggerStarted = true
    await RunAndDebug.waitForPaused({
      callStackSize: 11,
      file: 'index.js',
      line: 4,
    })
  } finally {
    try {
      if (debuggerStarted) {
        await RunAndDebug.stop()
      }
    } finally {
      try {
        await RunAndDebug.removeAllBreakpoints()
      } finally {
        await Editor.closeAll()
      }
    }
  }
}
