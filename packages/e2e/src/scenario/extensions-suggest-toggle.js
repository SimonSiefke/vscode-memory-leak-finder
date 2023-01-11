export const setup = async ({ page, expect }) => {
  const activityBar = page.locator("#workbench\\.parts\\.activitybar");
  const activityBarItemSearch = activityBar.locator(
    `.action-label[aria-label^="Extensions"]`
  );
  await activityBarItemSearch.click();

  const extensionsView = page.locator(".extensions-viewlet");
  await expect(extensionsView).toBeVisible();
  const extensionsInput = extensionsView.locator(".inputarea");
  await expect(extensionsInput).toBeFocused();
};

export const run = async ({ page, expect }) => {
  const extensionsView = page.locator(".extensions-viewlet");
  const extensionsInput = extensionsView.locator(".inputarea");
  await expect(extensionsInput).toBeFocused();

  await extensionsInput.press("Control+Space");
  const suggestions = page.locator('[aria-label="Suggest"]');
  await expect(suggestions).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(suggestions).toBeHidden();
};
