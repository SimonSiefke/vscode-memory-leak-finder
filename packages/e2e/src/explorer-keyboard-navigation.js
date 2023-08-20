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

export const beforeSetup = async ({ Workspace, Explorer }) => {
  const files = createFiles()
  await Workspace.setFiles(files)
  await Explorer.focus()
  await Explorer.shouldHaveItem(`file-9.txt`)
}

export const run = async ({ Explorer }) => {
  await Explorer.focusNext()
  await Explorer.focusNext()
  await Explorer.focusNext()
  await Explorer.click()
}
