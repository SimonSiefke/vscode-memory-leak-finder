export const run = async ({ Problems }) => {
  await Problems.show()
  await Problems.hide()
}
