export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const activityBar = page.locator(".part.activitybar");
        await expect(activityBar).toBeHidden();
        await page.keyboard.press("Control+Shift+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type("Toggle Activity Bar Visibility");
        const firstOption = quickPick.locator(".monaco-list-row").first();
        await firstOption.click();
        await expect(activityBar).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show activity bar`);
      }
    },
    async hide() {
      try {
        const activityBar = page.locator(".part.activitybar");
        await expect(activityBar).toBeVisible();
        await page.keyboard.press("Control+Shift+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type("Toggle Activity Bar Visibility");
        const firstOption = quickPick.locator(".monaco-list-row").first();
        await firstOption.click();
        await expect(activityBar).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to hide activity bar`);
      }
    },
  };
};
