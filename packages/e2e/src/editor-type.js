export const skip = true

export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, 'file.txt'), 'sample text')
}

export const setup = async ({ Editor }) => {
  await Editor.open('file.txt')
  await Editor.shouldHaveText('sample text')
}

export const run = async ({ Editor }) => {
  await Editor.shouldHaveText('sample text')
  await Editor.type('More ')
  await Editor.deleteCharactersLeft({ count: 5 })
  await Editor.shouldHaveText('sample text')
}
