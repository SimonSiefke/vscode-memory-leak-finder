const initialDiagnosticTimeout = 30_000;

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
    async hover(text) {
      try {
        const editor = page.locator(".editor-instance");
        await expect(editor).toBeVisible();
        const startTag = editor
          .locator('[class^="mtk"]', { hasText: text })
          .first();
        await startTag.click();
        await startTag.hover();
        const tooltip = page.locator(".monaco-hover");
        await expect(tooltip).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to hover ${text}`);
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
    async goToDefinition() {
      try {
        await page.keyboard.press("Control+Shift+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type("Go to Definition");
        const firstOption = quickPick.locator(".monaco-list-row").first();
        await expect(firstOption).toContainText("Go to Definition");
        await firstOption.click();
      } catch (error) {
        throw new VError(error, `Failed to go to definition`);
      }
    },
    async shouldHaveOverlayMessage(message) {
      try {
        const message = page.locator(".monaco-editor-overlaymessage");
        await expect(message).toBeVisible();
        await expect(message).toHaveText(message);
      } catch (error) {
        throw new VError(
          error,
          `Failed to check overlay message with text ${message}`
        );
      }
    },
    async click(text) {
      try {
        const editor = page.locator(".editor-instance");
        await expect(editor).toBeVisible();
        const startTag = editor
          .locator('[class^="mtk"]', { hasText: text })
          .first();
        await startTag.click();
      } catch (error) {
        throw new VError(error, `Failed to click ${text}`);
      }
    },
    async shouldHaveSquigglyError() {
      try {
        const squiggle = page.locator(".squiggly-error");
        await expect(squiggle).toBeVisible({
          timeout: initialDiagnosticTimeout,
        });
      } catch (error) {
        throw new VError(error, `Failed to verify squiggly error`);
      }
    },
    async shouldNotHaveSquigglyError() {
      try {
        const squiggle = page.locator(".squiggly-error");
        await expect(squiggle).toBeHidden();
      } catch (error) {
        throw new VError(
          error,
          `Failed to verify that editor has no squiggly error`
        );
      }
    },
    async deleteCharactersLeft({ count }) {
      try {
        for (let i = 0; i < count; i++) {
          await page.keyboard.press("Delete");
        }
      } catch (error) {
        throw new VError(error, `Failed to delete character left`);
      }
    },
    async type(text) {
      try {
        await page.keyboard.type(text);
      } catch (error) {
        throw new VError(error, `Failed to type ${text}`);
      }
    },
  };
};
