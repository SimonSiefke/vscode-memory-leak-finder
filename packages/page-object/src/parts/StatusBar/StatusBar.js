export const create = ({ page, VError }) => {
  return {
    async click(label) {
      try {
        const item = page.locator(`[aria-label="${label}"]`).first();
        await item.click();
      } catch (error) {
        throw new VError(error, `Failed to click status bar item ${label}`);
      }
    },
  };
};
