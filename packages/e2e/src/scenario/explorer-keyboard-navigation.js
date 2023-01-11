export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  const generateFile = async (_, index) => {
    await writeFile(join(tmpDir, `file-${index}.txt`), `file content ${index}`);
  };
  await Promise.all([...Array(10)].map(generateFile));
};

export const run = async ({ page, expect }) => {
  await page.keyboard.press("Control+Shift+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await quickPickInput.type("Focus Explorer");
  const firstOption = quickPick.locator(".monaco-list-row").first();
  await firstOption.click();
  const explorer = page.locator(".explorer-folders-view .monaco-list");
  await expect(explorer).toBeFocused();

  await page.keyboard.press("ArrowDown");
  expect(await explorer.getAttribute("aria-activedescendant")).toBe(
    "list_id_2_0"
  );

  await page.keyboard.press("ArrowDown");
  expect(await explorer.getAttribute("aria-activedescendant")).toBe(
    "list_id_2_1"
  );

  await page.keyboard.press("ArrowDown");
  expect(await explorer.getAttribute("aria-activedescendant")).toBe(
    "list_id_2_2"
  );

  await explorer.click();
};
