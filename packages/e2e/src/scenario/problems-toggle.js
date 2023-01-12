export const run = async ({ page, expect, StatusBar }) => {
  await StatusBar.showProblems();
  const panel = page.locator(".panel");
  const messageBoxContainer = panel
    .locator(".pane-body .message-box-container")
    .first();
  await expect(messageBoxContainer).toBeVisible();
  await expect(messageBoxContainer).toBeFocused();
  await expect(messageBoxContainer).toHaveText(
    "No problems have been detected in the workspace."
  );
  await StatusBar.hideProblems();
  await expect(messageBoxContainer).toBeHidden();
};
