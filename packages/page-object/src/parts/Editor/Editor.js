export const create = ({ page, expect }) => {
  return {
    async open(fileName) {
      await page.keyboard.press("Control+P");
      const quickPick = page.locator(".quick-input-widget");
      await expect(quickPick).toBeVisible();
      const quickPickInput = quickPick.locator('[role="combobox"]');
      await quickPickInput.type(fileName);
      const firstOption = quickPick.locator(".monaco-list-row").first();
      await firstOption.click();
      const tab = page.locator(".tab", { hasText: fileName });
      await expect(tab).toBeVisible();
      const editor = page.locator(".editor-instance");
      await expect(editor).toBeVisible();
    },
  };
};
