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

export const create = ({ page, expect }) => {
  return {
    async focus() {
      await page.keyboard.press("Control+Shift+P");
      const quickPick = page.locator(".quick-input-widget");
      await expect(quickPick).toBeVisible();
      const quickPickInput = quickPick.locator('[role="combobox"]');
      await quickPickInput.type("Focus Explorer");
      const firstOption = quickPick.locator(".monaco-list-row").first();
      await firstOption.click();
      const explorer = page.locator(".explorer-folders-view .monaco-list");
      await expect(explorer).toBeFocused();
    },
    async focusNext() {
      const explorer = page.locator(".explorer-folders-view .monaco-list");
      const current = await explorer.getAttribute("aria-activedescendant");
      const next = getNextActiveDescendant(current);
      await page.keyboard.press("ArrowDown");
      expect(await explorer.getAttribute("aria-activedescendant")).toBe(next);
    },
    async click() {
      const explorer = page.locator(".explorer-folders-view .monaco-list");
      await explorer.click();
    },
  };
};
