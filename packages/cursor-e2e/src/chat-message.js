export const setup = async ({ CursorChat }) => {
  await CursorChat.show()
}

export const run = async ({ CursorChat }) => {
  await CursorChat.sendMessage('respond with ok')
}
