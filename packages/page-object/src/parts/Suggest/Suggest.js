import * as Platform from "../Platform/Platform.js";

const modifier = Platform.isMacos ? "Meta" : "Control";

export const create = ({ page, expect, VError }) => {
  return {
    async open() {
      try {
        await page.keyboard.press(`${modifier}+Space`);
        const suggestWidget = page.locator(".suggest-widget");
        await expect(suggestWidget).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to open suggest widget`);
      }
    },
    async close() {
      try {
        const suggestWidget = page.locator(".suggest-widget");
        await expect(suggestWidget).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(suggestWidget).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to close suggest widget`);
      }
    },
  };
};
