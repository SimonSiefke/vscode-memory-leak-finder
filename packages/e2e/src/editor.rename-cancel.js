export const skip = true

export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(
    join(tmpDir, 'index.css'),
    `:root {
  --font-size: 10px;
}`,
  )
}

export const setup = async ({ page, expect }) => {
  await page.keyboard.press('Control+P')
  const quickPick = page.locator('.quick-input-widget')
  await expect(quickPick).toBeVisible()
  const quickPickInput = quickPick.locator('[role="combobox"]')
  await quickPickInput.type('index')
  const firstOption = quickPick.locator('.monaco-list-row').first()
  await firstOption.click()
  const editor = page.locator('.editor-instance')
  await expect(editor).toBeVisible()
}

export const run = async ({ page, expect }) => {
  const editor = page.locator('.editor-instance')
  await expect(editor).toBeVisible()
  const editorInput = editor.locator('.inputarea')
  await expect(editorInput).toBeFocused()

  const tokenFontSize = editor.locator('[class^="mtk"]', { hasText: 'font-size' }).first()
  await expect(tokenFontSize).toBeVisible()
  await tokenFontSize.click()

  await page.waitForTimeout(250) // TODO get rid of this timeout
  await page.keyboard.press('F2')
  const renameInput = page.locator('.rename-input')
  await expect(renameInput).toBeFocused()
  await page.keyboard.press('Escape')

  await expect(tokenFontSize).toBeVisible()
}
