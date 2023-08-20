export const skip = true

export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(
    join(tmpDir, 'file.css'),
    `h1 {
  font-size: 20px
}

h2 {
  font-size: 15px;
}`,
  )
}

export const setup = async ({ Editor }) => {
  await Editor.open('file.css')
}

export const run = async ({ Editor, page, expect }) => {
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
