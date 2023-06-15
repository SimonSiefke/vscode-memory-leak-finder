// TODO avoid using timeout
const SHORT_TIMEOUT = 250;

export const create = ({ page, VError, expect }) => {
  return {
    async click(label) {
      try {
        const item = page.locator(`[aria-label="${label}"]`).first();
        await item.click();
      } catch (error) {
        throw new VError(error, `Failed to click status bar item ${label}`);
      }
    },
    async item(id) {
      try {
        const selector = `#${id.replaceAll(".", "\\.")}`;
        const item = page.locator(selector).first();
        await expect(item).toBeVisible();
        return {
          async shouldHaveText(text) {
            await expect(item).toHaveText(text);
          },
          async click() {
            await item.click();
          },
          async hide() {
            await item.click({
              button: "right",
            });
            const contextMenu = page.locator(
              ".context-view.monaco-menu-container .actions-container"
            );
            await expect(contextMenu).toBeVisible();
            await expect(contextMenu).toBeFocused();
            const contextMenuItem = contextMenu
              .locator(".action-item", {
                hasText: "Hide 'Problems'",
              })
              .first();
            await expect(contextMenuItem).toBeVisible();
            await contextMenuItem.focus();
            await page.waitForTimeout(SHORT_TIMEOUT);
            await contextMenuItem.click({ force: true });
            await expect(contextMenu).toBeHidden();
            await expect(item).toBeHidden();
          },
          async show() {
            await expect(item).toBeHidden();
            const statusBar = page.locator(".part.statusbar");
            await statusBar.click({
              button: "right",
            });
            const contextMenu = page.locator(
              ".context-view.monaco-menu-container .actions-container"
            );
            await expect(contextMenu).toBeVisible();
            await expect(contextMenu).toBeFocused();
            const contextMenuItem = contextMenu
              .locator(".action-item", {
                hasText: "Problems",
              })
              .first();
            await page.waitForTimeout(SHORT_TIMEOUT);
            await contextMenuItem.click({ force: true });
            await expect(contextMenu).toBeHidden();
            await expect(item).toBeVisible();
          },
        };
      } catch (error) {
        throw new VError(error, `Failed to click status bar item ${id}`);
      }
    },
  };
};
