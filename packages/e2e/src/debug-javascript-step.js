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
}

export const run = async ({ Editor, RunAndDebug }) => {
  await Editor.open('index.js')
  await Editor.setBreakpoint(4)
  await RunAndDebug.runAndWaitForPaused()
  await RunAndDebug.step()
  await RunAndDebug.stop()
  await RunAndDebug.removeAllBreakpoints()
  await Editor.closeAll()
}
