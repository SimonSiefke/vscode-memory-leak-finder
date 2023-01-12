export const create = ({ expect, page, VError }) => {
  return {
    async showProblems() {
      try {
        const statusBar = page.locator(".statusbar");
        const statusBarItemProblems = statusBar.locator(
          '#status\\.problems [role="button"]'
        );
        await statusBarItemProblems.click();
        const panel = page.locator(".panel");
        const paneBody = panel.locator(".pane-body");
        await expect(paneBody).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show problems`);
      }
    },
    async hideProblems() {
      try {
        const panel = page.locator(".panel");
        await expect(panel).toBeVisible();
        const paneBody = panel.locator(".pane-body");
        await expect(paneBody).toBeVisible();
        const statusBar = page.locator(".statusbar");
        const statusBarItemProblems = statusBar.locator(
          '#status\\.problems [role="button"]'
        );
        await statusBarItemProblems.click();
      } catch (error) {
        throw new VError(error, `Failed to hide problems`);
      }
    },
  };
};
