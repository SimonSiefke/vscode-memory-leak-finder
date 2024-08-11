export const skip = true

export const setup = async ({ Editor, Workspace, Explorer, RunAndDebug }) => {
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
  await RunAndDebug.runAndWaitForPaused()
}

export const run = async ({ RunAndDebug }) => {
  await RunAndDebug.setValue('x', '1', '5')
  await RunAndDebug.setValue('x', '5', '1')
}

export const teardown = async ({ RunAndDebug, Editor }) => {
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
