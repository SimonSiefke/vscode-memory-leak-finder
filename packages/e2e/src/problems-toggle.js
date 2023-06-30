export const skip = true

export const run = async ({ page, expect, StatusBar }) => {
  const problemsButton = await StatusBar.item('status.problems')
  await problemsButton.click()

  const panel = page.locator('.panel')
  const messageBoxContainer = panel.locator('.pane-body .message-box-container').first()
  await expect(messageBoxContainer).toBeVisible()
  await expect(messageBoxContainer).toBeFocused()
  await expect(messageBoxContainer).toHaveText('No problems have been detected in the workspace.')

  await problemsButton.click()
  await expect(messageBoxContainer).toBeHidden()
}
