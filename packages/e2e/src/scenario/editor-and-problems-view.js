export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(
    join(tmpDir, "index.css"),
    `h1 {
  abc
}`
  );
};

export const setup = async ({ page, expect, Editor, StatusBar, Problems }) => {
  await Editor.open("index.css");
  await Editor.shouldHaveSquigglyError();
  const problemsButton = await StatusBar.item("status.problems");
  await problemsButton.click();
  const panel = page.locator(".part.panel.bottom");
  await expect(panel).toBeVisible();
  await Editor.focus();
  await Problems.shouldHaveCount(2);
};

export const run = async ({ Editor, Problems }) => {
  await Editor.shouldHaveSquigglyError();
  await Problems.shouldHaveCount(2);
  await Editor.click("abc");
  await Editor.deleteCharactersLeft({ count: 1 });
  await Editor.deleteCharactersRight({ count: 2 });
  await Editor.type("font-size: 10px;");
  await Editor.shouldNotHaveSquigglyError();
  await Problems.shouldHaveCount(0);
  await Editor.deleteCharactersLeft({ count: 16 });
  await Editor.type("abc");
  await Editor.shouldHaveSquigglyError();
  await Problems.shouldHaveCount(2);
};
