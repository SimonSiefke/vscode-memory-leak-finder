export const skip = true

export const run = async ({ Window }) => {
  await Window.focus()
  await Window.blur()
}
