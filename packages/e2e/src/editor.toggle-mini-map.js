export const skip = true

export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, 'file.txt'), 'sample text')
}

export const setup = async ({ Editor }) => {
  await Editor.open('file.txt')
}

export const run = async ({ QuickPick, page, expect }) => {
  const minimap = page.locator('.minimap')
  await expect(minimap).toBeVisible()
  await QuickPick.executeCommand('View: Toggle Minimap')
  await expect(minimap).toBeHidden()
  await QuickPick.executeCommand('View: Toggle Minimap')
  await expect(minimap).toBeVisible()
}
