export const skip = true

export const beforeSetup = async ({ tmpDir, writeFile, join, writeSettings }) => {
  await writeFile(join(tmpDir, 'a.txt'), 'a')
  await writeFile(join(tmpDir, 'b.txt'), 'b')
  await writeSettings({
    'window.titleBarStyle': 'custom',
  })
}

export const run = async ({ Editor, Explorer, ContextMenu, page, expect }) => {
  await Explorer.openContextMenu('a.txt')
  await ContextMenu.select('Select for Compare')
  await Explorer.openContextMenu('b.txt')
  await ContextMenu.select('Compare with Selected')
  const original = page.locator('.editor.original .view-lines')
  const modified = page.locator('.editor.modified .view-lines')
  await expect(original).toBeVisible()
  await expect(modified).toBeVisible()
  await expect(original).toHaveText('a')
  await expect(modified).toHaveText('b')
  await Editor.close()
}
