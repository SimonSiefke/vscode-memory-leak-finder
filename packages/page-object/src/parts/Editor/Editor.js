import * as Platform from "../Platform/Platform.js";
import * as QuickPick from "../QuickPick/QuickPick.js";

const modifier = Platform.isMacos ? "Meta" : "Control";

export const create = ({ page, expect, VError }) => {
  return {
    async open(fileName) {
      try {
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.openFile(fileName);
        const tab = page.locator(".tab", { hasText: fileName });
        await expect(tab).toBeVisible();
        const editor = page.locator(".editor-instance");
        await expect(editor).toBeVisible();
        const editorInput = editor.locator(".inputarea");
        await expect(editorInput).toBeFocused();
      } catch (error) {
        throw new VError(error, `Failed to open editor ${fileName}`);
      }
    },
    async splitRight() {
      try {
        const editors = page.locator(".editor-instance");
        const currentCount = await editors.count();
        const editorActions = page.locator(".editor-actions").first();
        if (currentCount === 0) {
          throw new Error("no open editor found");
        }
        await expect(editorActions).toBeVisible();
        const editorActionSplitRight = editorActions.locator(
          '[title^="Split Editor Right"]'
        );
        await editorActionSplitRight.click();
        await expect(editors).toHaveCount(currentCount + 1);
      } catch (error) {
        throw new VError(error, `Failed to split editor right`);
      }
    },
    async close() {
      try {
        const main = page.locator('[role="main"]');
        const tabs = main.locator('[role="tab"]');
        const currentCount = await tabs.count();
        if (currentCount === 0) {
          throw new Error("no open editor found");
        }
        await page.keyboard.press(`${modifier}+w`);
        await expect(tabs).toHaveCount(currentCount - 1);
      } catch (error) {
        throw new VError(error, `Failed to close editor`);
      }
    },
  };
};
