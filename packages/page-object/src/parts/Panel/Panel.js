import * as QuickPick from "../QuickPick/QuickPick.js";

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const panel = page.locator(".part.panel");
        await expect(panel).toBeHidden();
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.executeCommand("Toggle Panel Visibility");
        await expect(panel).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show panel`);
      }
    },
    async hide() {
      try {
        const panel = page.locator(".part.panel");
        await expect(panel).toBeVisible();
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.executeCommand("Toggle Panel Visibility");
        await expect(panel).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to hide panel`);
      }
    },
  };
};
