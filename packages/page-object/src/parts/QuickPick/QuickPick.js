import * as Platform from "../Platform/Platform.js";

const modifier = Platform.isMacos ? "Meta" : "Control";

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        await page.keyboard.press(`${modifier}+Shift+P`);
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const firstOption = quickPick.locator(".monaco-list-row").first();
        await expect(firstOption).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show quick pick`);
      }
    },
    async executeCommand(command) {
      await page.keyboard.press(`${modifier}+Shift+P`);
      const quickPick = page.locator(".quick-input-widget");
      await expect(quickPick).toBeVisible();
      const quickPickInput = quickPick.locator('[role="combobox"]');
      await quickPickInput.type(`> ${command}`);
      const option = quickPick.locator(".monaco-list-row", {
        hasText: command,
      });
      await option.click();
    },
    async openView(view) {
      await page.keyboard.press(`${modifier}+P`);
      const quickPick = page.locator(".quick-input-widget");
      await expect(quickPick).toBeVisible();
      const quickPickInput = quickPick.locator('[role="combobox"]');
      await quickPickInput.type(`view ${view}`);
      const option = quickPick
        .locator(".monaco-list-row", {
          hasText: view,
        })
        .first();
      await option.click();
    },
    async showColorTheme() {
      try {
        await this.executeCommand("Preferences: Color Theme");
      } catch (error) {
        throw new VError(error, `Failed to show quick pick color theme`);
      }
    },
    async focusNext() {
      try {
        // TODO verify that aria active descendant has changed
        await page.keyboard.press("ArrowDown");
      } catch (error) {
        throw new VError(error, `Failed to focus next quick pick item`);
      }
    },
    async focusPrevious() {
      try {
        // TODO verify that aria active descendant has changed
        await page.keyboard.press("ArrowUp");
      } catch (error) {
        throw new VError(error, `Failed to focus previous quick pick item`);
      }
    },
    async hide() {
      try {
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(quickPick).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to hide quick pick`);
      }
    },
  };
};
