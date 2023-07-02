const createFiles = () => {
  const files = []
  for (let i = 0; i < 10; i++) {
    files.push({
      name: `file-${i}.txt`,
      content: `file content ${i}`,
    })
  }
  return files
}

export const beforeSetup = async ({ Workspace }) => {
  const files = createFiles()
  await Workspace.setFiles(files)
}

export const run = async ({ Explorer }) => {
  await Explorer.focus()
  await Explorer.focusNext()
  await Explorer.focusNext()
  await Explorer.focusNext()
  await Explorer.click()
}
