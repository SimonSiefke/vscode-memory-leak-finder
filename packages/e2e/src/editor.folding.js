export const skip = true

export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.css',
      content: `h1 {
  font-size: 20px
}

h2 {
  font-size: 15px;
}`,
    },
  ])
  await Editor.open('file.css')
}

export const run = async ({ page, expect }) => {
  const inlineFolded = page.locator('.inline-folded')
  await expect(inlineFolded).toBeHidden()
  const collapsedIcon = page.locator('.codicon-folding-collapsed').first()
  await expect(collapsedIcon).toBeHidden()
  const foldingIcon = page.locator('.codicon-folding-expanded').first()
  await expect(foldingIcon).toBeVisible()
  const firstIcon = foldingIcon.first()
  await firstIcon.click()
  await expect(inlineFolded).toBeVisible()
  await expect(collapsedIcon).toBeVisible()
  await collapsedIcon.click()
  await expect(inlineFolded).toBeHidden()
  await expect(collapsedIcon).toBeHidden()
}

export const teardown = async ({ Editor }) => {
  await Editor.closeAll()
}
