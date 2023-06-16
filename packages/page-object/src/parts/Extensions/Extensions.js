export const create = ({ expect, page, VError }) => {
  return {
    async search(value) {
      try {
        const extensionsView = page.locator(`.extensions-viewlet`);
        await expect(extensionsView).toBeVisible();
        const extensionsInput = extensionsView.locator(".inputarea");
        await expect(extensionsInput).toBeFocused();
        await extensionsInput.type(value);
      } catch (error) {
        throw new VError(error, `Failed to search for ${value}`);
      }
    },
    async show() {
      try {
        const extensionsView = page.locator(`.extensions-viewlet`);
        await expect(extensionsView).toBeHidden();
        await page.keyboard.press("Control+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type("view extensions");
        const option = quickPick
          .locator(".monaco-list-row", {
            hasText: "Extensions",
          })
          .first();
        await option.click();
        await expect(extensionsView).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show extensions view`);
      }
    },
    async hide() {
      try {
        const extensionsView = page.locator(`.extensions-viewlet`);
        await expect(extensionsView).toBeVisible();
        await page.keyboard.press("Control+Shift+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type("Toggle Side Bar Visibility");
        const firstOption = quickPick.locator(".monaco-list-row").first();
        await firstOption.click();
        await expect(extensionsView).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to hide extensions view`);
      }
    },
    async openSuggest() {
      try {
        const extensionsView = page.locator(".extensions-viewlet");
        const extensionsInput = extensionsView.locator(".inputarea");
        await expect(extensionsInput).toBeFocused();
        await extensionsInput.press("Control+Space");
        // TODO scope selector to extensions view
        const suggestions = page.locator('[aria-label="Suggest"]');
        await expect(suggestions).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to open extensions suggestions`);
      }
    },
    async closeSuggest() {
      try {
        // TODO scope selector to extensions view
        const suggestions = page.locator('[aria-label="Suggest"]');
        await expect(suggestions).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(suggestions).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to close extensions suggestions`);
      }
    },
  };
};
