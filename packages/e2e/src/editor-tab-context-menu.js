export const skip = true

const generateFileContent = () => {
  return Array(200).fill('sample text').join('\n')
}

export const beforeSetup = async ({ tmpDir, writeFile, join, writeSettings }) => {
  await writeSettings({
    'window.titleBarStyle': 'custom',
  })
  await writeFile(join(tmpDir, 'file.txt'), generateFileContent())
}

export const setup = async ({ Editor }) => {
  await Editor.open('file.txt')
}

export const run = async ({ Tab, ContextMenu }) => {
  await Tab.openContextMenu('file.txt')
  await ContextMenu.close()
}
