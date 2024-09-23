export const skip = true

export const setup = async ({ Terminal, Workspace, SideBar }) => {
  await Terminal.killAll()
  await Workspace.setFiles([])
  await SideBar.hide()
  await new Promise((r) => {
    setTimeout(r, 1000)
  })
  await Terminal.show()
  // await Terminal.focus()
}

export const run = async ({ Terminal }) => {
  await Terminal.execute('echo test > test.txt')
  // await Terminal.split()
  // await Terminal.killSecond()
}
