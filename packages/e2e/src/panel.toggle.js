export const skip = true

export const setup = async ({ Panel }) => {
  await Panel.hide()
}

export const run = async ({ Panel }) => {
  await Panel.show()
  await Panel.close()
}
