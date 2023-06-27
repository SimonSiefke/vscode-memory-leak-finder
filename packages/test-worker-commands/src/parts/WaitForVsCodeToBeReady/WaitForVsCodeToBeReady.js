export const waitForVsCodeToBeReady = async ({ page, expect }) => {
  const main = page.locator('[role="main"]')
  await expect(main).toBeVisible({
    timeout: 30_000,
  })
  const notification = page.locator('text=All installed extensions are temporarily disabled.').first()
  await expect(notification).toBeVisible({
    timeout: 15_000,
  })
}
