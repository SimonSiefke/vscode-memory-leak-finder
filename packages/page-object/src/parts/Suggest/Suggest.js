export const create = ({ page, expect }) => {
  return {
    async open() {
      await page.keyboard.press("Control+Space");
      const suggestWidget = page.locator(".suggest-widget");
      await expect(suggestWidget).toBeVisible();
    },
    async close() {
      const suggestWidget = page.locator(".suggest-widget");
      await expect(suggestWidget).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(suggestWidget).toBeHidden();
    },
  };
};
