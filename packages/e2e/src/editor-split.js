export const skip = true

export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, 'file.txt'), 'sample text')
}

export const setup = async ({ Editor }) => {
  await Editor.open('file.txt')
}

export const run = async ({ Editor }) => {
  await Editor.splitRight()
  await Editor.close()
}
