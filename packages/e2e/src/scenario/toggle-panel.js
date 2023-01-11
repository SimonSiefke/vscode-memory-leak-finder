export const run = async ({ page, expect }) => {
  const panel = page.locator(".part.panel");
  await expect(panel).toBeHidden();

  await page.keyboard.press("Control+Shift+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await quickPickInput.type("Toggle Panel Visibility");
  const firstOption = quickPick.locator(".monaco-list-row").first();
  await firstOption.click();
  await expect(panel).toBeVisible();

  await page.keyboard.press("Control+Shift+P");
  await expect(quickPick).toBeVisible();
  await quickPickInput.type("Toggle Panel Visibility");
  await firstOption.click();
  await expect(panel).toBeHidden();
};
