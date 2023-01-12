import * as QuickPick from "../QuickPick/QuickPick.js";

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const extensionsView = page.locator(`.extensions-viewlet`);
        await expect(extensionsView).toBeHidden();
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.openView("Extensions");
        await expect(extensionsView).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show extensions view`);
      }
    },
    async hide() {
      try {
        const extensionsView = page.locator(`.extensions-viewlet`);
        await expect(extensionsView).toBeVisible();
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.executeCommand("Toggle Primary Side Bar Visibility");
        await expect(extensionsView).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to hide extensions view`);
      }
    },
  };
};
