export const skip = true

export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, 'file.txt'), 'sample text')
}

export const run = async ({ Editor }) => {
  await Editor.open('file.txt')
  await Editor.close()
}
