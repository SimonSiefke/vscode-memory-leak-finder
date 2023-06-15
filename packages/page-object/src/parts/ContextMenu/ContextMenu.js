// TODO avoid using timeout
const SHORT_TIMEOUT = 250;

export const create = ({ expect, page, VError }) => {
  return {
    async select(option) {
      const contextMenu = page.locator(
        ".context-view.monaco-menu-container .actions-container"
      );
      await expect(contextMenu).toBeVisible();
      await expect(contextMenu).toBeFocused();
      const contextMenuItem = contextMenu
        .locator(".action-item", {
          hasText: option,
        })
        .first();
      await page.waitForTimeout(SHORT_TIMEOUT);
      await contextMenuItem.click();
    },
    async close() {
      try {
        const contextMenu = page.locator(".context-view.monaco-menu-container");
        await expect(contextMenu).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(contextMenu).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to close tab context menu`);
      }
    },
  };
};
