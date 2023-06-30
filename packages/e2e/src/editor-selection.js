export const skip = true

export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, 'index.html'), '<h1>hello world</h1>')
}

export const setup = async ({ Editor }) => {
  await Editor.open('index.html')
}

export const run = async ({ Editor }) => {
  await Editor.select('h1')
  await Editor.shouldHaveSelection('8px', /(15px|17px)/)
  await Editor.cursorRight()
  await Editor.shouldHaveEmptySelection()
}
