export const skip = true

const getContent = (letterCount) => {
  let code = ''
  for (let i = 0; i < letterCount; i++) {
    const letterCode = 97 + i
    const letter = String.fromCharCode(letterCode)
    const indent = '  '.repeat(i)
    code += indent + `function ${letter}(){\n\n\n`
  }
  for (let i = 0; i < letterCount; i++) {
    const indent = '  '.repeat(letterCount - i - 1)
    code += indent + `}\n\n`
  }
  return code
}

export const setup = async ({ Workspace, Editor }) => {
  await Editor.closeAll()
  const content = getContent(20)
  await Workspace.setFiles([
    {
      name: 'file.js',
      content: content,
    },
  ])
  await Editor.open('file.js')
  await Editor.disableStickyScroll()
  await Editor.enableStickyScroll()
  await Editor.focus()
  await Editor.shouldHaveCursor('0px')
}

export const run = async ({ Editor }) => {
  await Editor.shouldHaveActiveLineNumber(1)
  await Editor.scrollDown()
  await Editor.shouldHaveActiveLineNumber(101)
  await Editor.scrollUp()
  await Editor.shouldHaveActiveLineNumber(1)
}
