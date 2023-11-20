export const skip = true

export const run = async ({ Output }) => {
  await Output.show()
  await Output.hide()
}
