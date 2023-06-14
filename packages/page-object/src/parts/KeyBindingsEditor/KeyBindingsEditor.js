const getKeybindingButtonsText = (keyBinding) => {
  if (keyBinding.startsWith("Control+")) {
    return `Ctrl+${keyBinding.slice("Control+".length)}`;
  }
  return keyBinding;
};

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        await page.keyboard.press("Control+P");
        const quickPick = page.locator(".quick-input-widget");
        await expect(quickPick).toBeVisible();
        const quickPickInput = quickPick.locator('[role="combobox"]');
        await quickPickInput.type("> open keyboard shortcuts");
        const firstOption = quickPick.locator(".monaco-list-row").nth(1);
        await firstOption.click();
        const keyBindingsEditor = page.locator(".keybindings-editor");
        await expect(keyBindingsEditor).toBeVisible();
      } catch (error) {
        throw new VError(error, `Failed to show keybindings editor`);
      }
    },
    async setKeyBinding(commandName, keyBinding) {
      try {
        const keyBindingsEditor = page.locator(".keybindings-editor");
        await expect(keyBindingsEditor).toBeVisible();
        const row = keyBindingsEditor
          .locator(`.monaco-list-row[aria-label^="${commandName}"]`)
          .first();
        await row.dblclick();
        const defineKeyBindingWidget = page.locator(".defineKeybindingWidget");
        await expect(defineKeyBindingWidget).toBeVisible();
        const defineKeyBindingInput = defineKeyBindingWidget.locator("input");
        await expect(defineKeyBindingInput).toBeFocused();
        await page.keyboard.press(keyBinding);
        await expect(defineKeyBindingInput).toHaveValue(
          keyBinding.replace("Control", "ctrl").toLowerCase()
        );
        await page.keyboard.press("Enter");
        await expect(defineKeyBindingWidget).toBeHidden();
        const keyBindingsButtonText = getKeybindingButtonsText(keyBinding);
        const rowKeybinding = row.locator(".keybinding");
        await expect(rowKeybinding).toHaveText(keyBindingsButtonText);
      } catch (error) {
        throw new VError(error, `Failed to type into search input`);
      }
    },
  };
};
