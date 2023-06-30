export const skip = true

export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  const generateFile = async (_, index) => {
    await writeFile(join(tmpDir, `file-${index}.txt`), `file content ${index}`)
  }
  await Promise.all([...Array(10)].map(generateFile))
}

export const run = async ({ Explorer }) => {
  await Explorer.focus()
  await Explorer.focusNext()
  await Explorer.focusNext()
  await Explorer.focusNext()
  await Explorer.click()
}
