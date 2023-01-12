import * as QuickPick from "../QuickPick/QuickPick.js";

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const sideBar = page.locator(".part.sidebar");
        await expect(sideBar).toBeHidden();
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.executeCommand("Toggle Side Bar Bar Visibility");
        await expect(sideBar).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show side bar`);
      }
    },
    async hide() {
      try {
        const sideBar = page.locator(".part.sidebar");
        await expect(sideBar).toBeVisible();
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.executeCommand("Toggle Side Bar Bar Visibility");
        await expect(sideBar).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to hide side bar`);
      }
    },
    async moveRight() {
      try {
        const sideBar = page.locator(".part.sidebar");
        await expect(sideBar).toBeVisible();
        await expect(sideBar).toHaveClass("part sidebar left");
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.executeCommand("Toggle Side Bar Bar Position");
        await expect(sideBar).toHaveClass("part sidebar right");
      } catch (error) {
        throw new VError(error, `Failed to move side bar right`);
      }
    },
    async moveLeft() {
      try {
        const sideBar = page.locator(".part.sidebar");
        await expect(sideBar).toBeVisible();
        await expect(sideBar).toHaveClass("part sidebar right");
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.executeCommand("Toggle Side Bar Bar Position");
        await expect(sideBar).toHaveClass("part sidebar left");
      } catch (error) {
        throw new VError(error, `Failed to move side bar left`);
      }
    },
  };
};
