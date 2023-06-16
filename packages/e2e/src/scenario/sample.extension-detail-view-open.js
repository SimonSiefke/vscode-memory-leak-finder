export const setup = async ({ Extensions }) => {
  await Extensions.show();
  await Extensions.search("@builtin html");
};

export const run = async ({ page, expect, Editor }) => {
  const firstExtension = page.locator(".extension-list-item").first();
  await expect(firstExtension).toBeVisible();
  const nameLocator = firstExtension.locator(".name");
  await expect(nameLocator).toHaveText("HTML Language Basics");
  const name = await nameLocator.textContent();
  await firstExtension.click();
  const tabLabel = page.locator(".tab-label");
  await expect(tabLabel).toBeVisible();
  await expect(tabLabel).toHaveText(`Extension: ${name}`);
  const extensionEditor = page.locator(".extension-editor");
  await expect(extensionEditor).toBeVisible();
  const heading = extensionEditor.locator(".name").first();
  await expect(heading).toHaveText(name);
  await Editor.close();
};
