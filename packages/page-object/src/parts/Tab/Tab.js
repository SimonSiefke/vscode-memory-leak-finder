export const create = ({ expect, page, VError }) => {
  return {
    async openContextMenu(label) {
      try {
        const tab = page.locator(".tab", { hasText: "file.txt" });
        await tab.click({ button: "right" });
        const contextMenu = page.locator(".context-view.monaco-menu-container");
        await expect(contextMenu).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to open tab context menu`);
      }
    },
  };
};
