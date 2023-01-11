export const run = async ({ page, expect }) => {
  const sideBar = page.locator(".part.sidebar");
  await expect(sideBar).toBeVisible();

  await page.keyboard.press("Control+Shift+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await quickPickInput.type("Toggle Side Bar Position");
  const firstOption = quickPick.locator(".monaco-list-row").first();
  await firstOption.click();
  await expect(sideBar).toHaveClass("part sidebar right");

  await page.keyboard.press("Control+Shift+P");
  await expect(quickPick).toBeVisible();
  await quickPickInput.type("Toggle Side Bar Position");
  await firstOption.click();

  await expect(sideBar).toHaveClass("part sidebar left");
};
