export const create = ({ expect, page, VError }) => {
  return {
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
