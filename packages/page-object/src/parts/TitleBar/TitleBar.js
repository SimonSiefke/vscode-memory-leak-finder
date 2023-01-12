export const create = ({ expect, page, VError }) => {
  return {
    async openMenu(text) {
      try {
        const titleBar = page.locator(".part.titlebar");
        await expect(titleBar).toBeVisible();

        const menuItem = titleBar
          .locator(".menubar-menu-button", {
            hasText: text,
          })
          .first();
        await menuItem.click();
        const menu = page.locator(".monaco-menu .actions-container");
        expect(menu).toBeVisible();
        await expect(menu).toBeFocused();
      } catch (error) {
        throw new VError(error, `Failed to open title bar menu`);
      }
    },
    async hideMenu(text) {
      try {
        const titleBar = page.locator(".part.titlebar");
        await expect(titleBar).toBeVisible();

        const menuItem = titleBar
          .locator(".menubar-menu-button", {
            hasText: text,
          })
          .first();
        const menu = page.locator(".monaco-menu .actions-container");
        expect(menu).toBeVisible();
        await expect(menu).toBeFocused();

        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
        await expect(menuItem).toBeFocused();
      } catch (error) {
        throw new VError(error, `Failed to hide title bar menu`);
      }
    },
  };
};
