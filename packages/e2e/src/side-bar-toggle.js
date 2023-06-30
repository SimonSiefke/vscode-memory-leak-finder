export const skip = true

export const run = async ({ SideBar }) => {
  await SideBar.hide()
  await SideBar.show()
}
