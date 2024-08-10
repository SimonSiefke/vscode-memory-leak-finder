export const skip = true

export const setup = async ({ Editor, Workspace, Explorer }) => {
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
}

export const run = async ({ Editor, RunAndDebug }) => {
  await Editor.open('index.js')
  await Editor.setBreakpoint(4)
  await RunAndDebug.runAndWaitForPaused()
  await new Promise((r) => {})
  await RunAndDebug.stop()
  await Editor.closeAll()
}
