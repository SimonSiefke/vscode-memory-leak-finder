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
        };
      } catch (error) {
        throw new VError(error, `Failed to click status bar item ${label}`);
      }
    },
  };
};
