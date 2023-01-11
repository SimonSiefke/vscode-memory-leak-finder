const RE_NUMER_AT_END = /\d+$/;

const getNextActiveDescendant = (activeDescendant) => {
  // TODO list id can be dynamic
  if (activeDescendant === null) {
    return "list_id_2_0";
  }
  const match = activeDescendant.match(RE_NUMER_AT_END);
  if (!match) {
    throw new Error(`Failed to parse active descendant ${activeDescendant}`);
  }
  const number = parseInt(match[0]);
  return `list_id_2_${number + 1}`;
};

export const create = ({ page, expect, VError }) => {
  return {
    async focus() {
      try {
        await page.keyboard.press("Control+Shift+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type("Focus Explorer");
        const firstOption = quickPick.locator(".monaco-list-row").first();
        await firstOption.click();
        const explorer = page.locator(".explorer-folders-view .monaco-list");
        await expect(explorer).toBeFocused();
      } catch (error) {
        throw new VError(error, `Failed to focus explorer`);
      }
    },
    async focusNext() {
      try {
        const explorer = page.locator(".explorer-folders-view .monaco-list");
        const current = await explorer.getAttribute("aria-activedescendant");
        const next = getNextActiveDescendant(current);
        await page.keyboard.press("ArrowDown");
        expect(await explorer.getAttribute("aria-activedescendant")).toBe(next);
      } catch (error) {
        throw new VError(error, `Failed to focus next item in explorer`);
      }
    },
    async click() {
      try {
        const explorer = page.locator(".explorer-folders-view .monaco-list");
        await explorer.click();
      } catch (error) {
        throw new VError(error, `Failed to click into explorer`);
      }
    },
  };
};
