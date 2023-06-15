export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(
    join(tmpDir, "index.css"),
    `:root {
  --font-size: 10px;
}`
  );
};

export const setup = async ({ Editor, page, expect }) => {
  await Editor.open("index.css");
  await Editor.shouldHaveText(`:root {
  --font-size: 10px;
}`);
  await Editor.type("abc");
  await Editor.deleteCharactersLeft({ count: 3 });
  const token = page.locator(`[class^="mtk"]`, {
    hasText: "font-size",
  });
  await expect(token).toHaveCSS("color", "rgb(156, 220, 254)");
};

export const run = async ({ page, expect, Editor }) => {
  await Editor.click("font-size");
  const cursor = page.locator(".cursor");
  await expect(cursor).toHaveCSS("left", /(53px|58px|66px)/);
  await Editor.rename("--abc");
  await Editor.shouldHaveText(`:root {
  --abc: 10px;
}`);
  await Editor.rename("--font-size");
  await Editor.shouldHaveText(`:root {
  --font-size: 10px;
}`);
};
