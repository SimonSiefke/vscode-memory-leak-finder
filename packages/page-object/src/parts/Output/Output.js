import * as QuickPick from "../QuickPick/QuickPick.js";

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const outputView = page.locator(".pane-body.output-view");
        await expect(outputView).toBeHidden();
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.executeCommand("Output: Focus on Output View");
        await expect(outputView).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show output`);
      }
    },
    async hide() {
      try {
        const outputView = page.locator(".pane-body.output-view");
        await expect(outputView).toBeVisible();
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.executeCommand("View: Close Panel");
        await expect(outputView).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to show output`);
      }
    },
  };
};
