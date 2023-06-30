export const skip = true

export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, 'index.html'), '')
}

export const setup = async ({ Editor }) => {
  await Editor.open('index.html')
}

export const run = async ({ Suggest }) => {
  await Suggest.open()
  await Suggest.close()
}
