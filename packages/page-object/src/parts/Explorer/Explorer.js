import * as QuickPick from "../QuickPick/QuickPick.js";

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
        const quickPick = QuickPick.create({ page, expect, VError });
        await quickPick.executeCommand("Focus Explorer");
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
    async expand(folderName) {
      try {
        const explorer = page.locator(".explorer-folders-view .monaco-list");
        const folder = explorer.locator(".monaco-list-row", {
          hasText: folderName,
        });
        // TODO verify that folder has aria-expanded=false
        await folder.click();
      } catch (error) {
        throw new VError(error, `Failed to expand explorer folder`);
      }
    },
    async collapse(folderName) {
      try {
        const explorer = page.locator(".explorer-folders-view .monaco-list");
        const folder = explorer.locator(".monaco-list-row", {
          hasText: folderName,
        });
        // TODO verify that folder has aria-expanded=false
        await folder.click();
      } catch (error) {
        throw new VError(error, `Failed to expand explorer folder`);
      }
    },
    async toHaveItem(direntName) {
      try {
        const explorer = page.locator(".explorer-folders-view .monaco-list");
        const dirent = explorer.locator(".monaco-list-row", {
          hasText: direntName,
        });
        await expect(dirent).toBeVisible();
      } catch (error) {
        throw new VError(
          error,
          `Failed to verify that explorer has dirent ${direntName}`
        );
      }
    },
    async rename(oldDirentName, newDirentName) {
      try {
        // TODO avoid using timeout
        const SHORT_TIMEOUT = 250;

        const explorer = page.locator(".explorer-folders-view .monaco-list");
        const oldDirent = explorer.locator(".monaco-list-row", {
          hasText: oldDirentName,
        });
        await expect(oldDirent).toBeVisible();
        await oldDirent.click({
          button: "right",
        });
        const contextMenu = page.locator(
          ".context-view.monaco-menu-container .actions-container"
        );
        await expect(contextMenu).toBeVisible();
        await expect(contextMenu).toBeFocused();
        const contextMenuItemRename = contextMenu.locator(".action-item", {
          hasText: "Rename",
        });
        await page.waitForTimeout(SHORT_TIMEOUT);
        await contextMenuItemRename.click();
        const input = explorer.locator("input");
        await input.selectText();
        await input.type(newDirentName);
        await input.press("Enter");
        await expect(oldDirent).toBeHidden();
        const newDirent = explorer.locator(`text=${newDirentName}`);
        await expect(newDirent).toBeVisible();
      } catch (error) {
        throw new VError(
          error,
          `Failed to rename explorer item from ${oldDirentName} to ${newDirentName}`
        );
      }
    },
    not: {
      async toHaveItem(direntName) {
        try {
          const explorer = page.locator(".explorer-folders-view .monaco-list");
          const dirent = explorer.locator(".monaco-list-row", {
            hasText: direntName,
          });
          await expect(dirent).not.toBeVisible();
        } catch (error) {
          throw new VError(
            error,
            `Failed to verify that explorer doesn't have dirent ${direntName}`
          );
        }
      },
    },
  };
};
