export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
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
      } catch (error) {
        throw new VError(error, `Failed to show panel`);
      }
    },
    async hide() {
      try {
        const panel = page.locator(".part.panel");
        await expect(panel).toBeVisible();
        const quickPick = page.locator(".quick-input-widget");
        await page.keyboard.press("Control+Shift+P");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type("Toggle Panel Visibility");
        const firstOption = quickPick.locator(".monaco-list-row").first();
        await firstOption.click();
        await expect(panel).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to hide panel`);
      }
    },
  };
};
