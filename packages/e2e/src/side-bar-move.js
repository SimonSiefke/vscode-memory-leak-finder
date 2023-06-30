export const skip = true

export const run = async ({ SideBar }) => {
  await SideBar.moveRight()
  await SideBar.moveLeft()
}
