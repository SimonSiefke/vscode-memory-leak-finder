import * as QuickPick from "../QuickPick/QuickPick.js";

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const activityBar = page.locator(".part.activitybar");
        await expect(activityBar).toBeHidden();
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.executeCommand("Toggle Activity Bar Visibility");
        await expect(activityBar).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show activity bar`);
      }
    },
    async showSearch() {
      try {
        const activityBar = page.locator(".part.activitybar");
        await expect(activityBar).toBeVisible();
        const activityBarItem = activityBar.locator(
          `.action-label[aria-label^="Search"]`
        );
        await activityBarItem.click();
        const searchView = page.locator(".search-view");
        await expect(searchView).toBeVisible();
        const searchInput = searchView.locator('textarea[title="Search"]');
        await expect(searchInput).toBeFocused();
      } catch (error) {
        throw new VError(error, `Failed to show search`);
      }
    },
    async hide() {
      try {
        const activityBar = page.locator(".part.activitybar");
        await expect(activityBar).toBeVisible();
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.executeCommand("Toggle Activity Bar Visibility");
        await expect(activityBar).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to hide activity bar`);
      }
    },
  };
};
