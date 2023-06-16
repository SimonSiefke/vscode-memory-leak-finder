export const create = ({ expect, page, VError }) => {
  return {
    async toggle() {
      try {
        const quickPick = page.locator(".quick-input-widget");
        await page.keyboard.press("Control+Shift+P");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await expect(quickPickInput).toBeVisible();
        await expect(quickPickInput).tobeFocused();
        await quickPickInput.type("Toggle Panel Visibility");
        const firstOption = quickPick.locator(".monaco-list-row").first();
        const firstOptionLabel = firstOption.locator(".label-name");
        await expect(firstOptionLabel).toHaveText(
          "View: Toggle Panel Visibility"
        );
        await expect(firstOption).toBeVisible();
        await firstOption.click();
      } catch (error) {
        throw new VError(error, `Failed to toggle panel`);
      }
    },
    async show() {
      try {
        const panel = page.locator(".part.panel");
        await expect(panel).toBeHidden();
        await this.toggle();
        await expect(panel).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show panel`);
      }
    },
    async hide() {
      try {
        const panel = page.locator(".part.panel");
        await expect(panel).toBeVisible();
        await this.toggle();
        await expect(panel).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to hide panel`);
      }
    },
  };
};
