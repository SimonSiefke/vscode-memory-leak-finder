export const run = async ({ page, expect }) => {
  await page.keyboard.press("Control+Shift+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const firstOption = quickPick.locator(".monaco-list-row").first();
  await expect(firstOption).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(quickPick).toBeHidden();
};
