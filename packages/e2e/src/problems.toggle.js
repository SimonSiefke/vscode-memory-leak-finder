export const setup = async ({ Panel }) => {
  await Panel.hide()
}

export const run = async ({ Problems }) => {
  await Problems.show()
  await Problems.hide()
}
