export const create = ({ page, expect, VError }) => {
  return {
    async open(fileName) {
      try {
        await page.keyboard.press("Control+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type(fileName);
        const firstOption = quickPick.locator(".monaco-list-row").first();
        const label = firstOption
          .locator(".monaco-icon-label-container")
          .first();
        await expect(label).toHaveText(fileName);
        await firstOption.click();
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
        await page.keyboard.press("Control+w");
        await expect(tabs).toHaveCount(currentCount - 1);
      } catch (error) {
        throw new VError(error, `Failed to close editor`);
      }
    },
    async select(text) {
      try {
        const editor = page.locator(".editor-instance");
        const element = editor
          .locator('[class^="mtk"]', { hasText: text })
          .first();
        await expect(element).toHaveText(text);
        await element.dblclick();
        const selection = page.locator(".selected-text");
        await expect(selection).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to select ${text}`);
      }
    },
    async cursorRight() {
      try {
        await page.keyboard.press("ArrowRight");
      } catch (error) {
        throw new VError(error, `Failed to move cursor right`);
      }
    },
    async shouldHaveSelection(left, width) {
      try {
        const selection = page.locator(".selected-text");
        await expect(selection).toBeVisible();
        await expect(selection).toHaveCSS("left", left);
        await expect(selection).toHaveCSS("width", width);
      } catch (error) {
        throw new VError(error, `Failed to verify editor selection`);
      }
    },
    async shouldHaveEmptySelection() {
      try {
        const selection = page.locator(".selected-text");
        await expect(selection).toBeHidden();
      } catch (error) {
        throw new VError(error, `Failed to verify editor selection`);
      }
    },
  };
};
