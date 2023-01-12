export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        await page.keyboard.press("Control+Shift+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const firstOption = quickPick.locator(".monaco-list-row").first();
        await expect(firstOption).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show quick pick`);
      }
    },
    async hide() {
      try {
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(quickPick).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to hide quick pick`);
      }
    },
  };
};
