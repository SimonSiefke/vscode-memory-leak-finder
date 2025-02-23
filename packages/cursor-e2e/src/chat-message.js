export const run = async ({ CursorChat }) => {
  await CursorChat.resetFocus()
  await CursorChat.show()
  await CursorChat.sendMessage('respond with just "ok". nothing else')
  await CursorChat.shouldHaveMessageCount(2)
  await CursorChat.shouldHaveResponse('ok')
}
