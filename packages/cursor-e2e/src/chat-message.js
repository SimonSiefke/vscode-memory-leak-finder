export const setup = async ({ CursorChat }) => {
  await CursorChat.resetFocus()
  await CursorChat.show()
}

export const run = async ({ CursorChat }) => {
  await CursorChat.sendMessage('respond with just "ok". nothing else')
  await CursorChat.shouldHaveMessageCount(2)
  await CursorChat.shouldHaveResponse('ok')
  await CursorChat.resetFocus()
}
