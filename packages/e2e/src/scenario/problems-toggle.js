export const run = async ({ page, expect }) => {
  const statusBar = page.locator(".statusbar");
  const statusBarItemProblems = statusBar.locator(
    '#status\\.problems [role="button"]'
  );
  await statusBarItemProblems.click();
  const panel = page.locator(".panel");
  const messageBoxContainer = panel
    .locator(".pane-body .message-box-container")
    .first();
  await expect(messageBoxContainer).toBeVisible();
  await expect(messageBoxContainer).toBeFocused();
  await expect(messageBoxContainer).toHaveText(
    "No problems have been detected in the workspace."
  );

  await statusBarItemProblems.click();
  await expect(messageBoxContainer).toBeHidden();
};
