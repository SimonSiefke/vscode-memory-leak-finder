export const skip = true

export const setup = async ({ ActivityBar, Search, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await ActivityBar.showSearch()
  await Search.type('sample')
  await Search.toHaveResults(['file.txt1', 'sample text'])
}

export const run = async ({ Search, page, expect, Editor }) => {
  // await Search.deleteText();
  const link = page.locator('a', {
    hasText: 'Open in editor',
  })
  await expect(link).toBeVisible()
  await link.click()
  const tabLabel = page.locator('.tab-label')
  await expect(tabLabel).toBeVisible()
  await expect(tabLabel).toHaveText(`Search: sample`)
  const searchEditor = page.locator('.search-editor')
  await expect(searchEditor).toBeVisible()
  const line = searchEditor.locator('.view-line').first()
  await expect(line).toBeVisible()
  await expect(line).toHaveText('1 result - 1 file')
  await Editor.close()
}
