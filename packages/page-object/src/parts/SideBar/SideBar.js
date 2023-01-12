export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const sideBar = page.locator(".part.sidebar");
        await expect(sideBar).toBeHidden();
        await page.keyboard.press("Control+Shift+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type("Toggle Side Bar Visibility");
        const firstOption = quickPick.locator(".monaco-list-row").first();
        await firstOption.click();
        await expect(sideBar).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show side bar`);
      }
    },
    async hide() {
      try {
        const sideBar = page.locator(".part.sidebar");
        await expect(sideBar).toBeVisible();

        await page.keyboard.press("Control+Shift+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type("Toggle Side Bar Visibility");
        const firstOption = quickPick.locator(".monaco-list-row").first();
        await firstOption.click();
        await expect(sideBar).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to hide side bar`);
      }
    },
    async moveRight() {
      try {
        const sideBar = page.locator(".part.sidebar");
        await expect(sideBar).toBeVisible();
        await expect(sideBar).toHaveClass("part sidebar left");
        await page.keyboard.press("Control+Shift+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type("Toggle Side Bar Position");
        const firstOption = quickPick.locator(".monaco-list-row").first();
        await firstOption.click();
        await expect(sideBar).toHaveClass("part sidebar right");
      } catch (error) {
        throw new VError(error, `Failed to move side bar right`);
      }
    },
    async moveLeft() {
      try {
        const sideBar = page.locator(".part.sidebar");
        await expect(sideBar).toBeVisible();
        await expect(sideBar).toHaveClass("part sidebar right");
        await page.keyboard.press("Control+Shift+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type("Toggle Side Bar Position");
        const firstOption = quickPick.locator(".monaco-list-row").first();
        await firstOption.click();
        await expect(sideBar).toHaveClass("part sidebar left");
      } catch (error) {
        throw new VError(error, `Failed to move side bar left`);
      }
    },
  };
};
