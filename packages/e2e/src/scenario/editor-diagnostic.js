export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(
    join(tmpDir, "index.css"),
    `h1{
    abc
}`
  );
};

export const setup = async ({ page, expect, Editor }) => {
  await Editor.open("index.css");
  await Editor.shouldHaveSquigglyError();
};

export const run = async ({ Editor, Hover }) => {
  await Editor.shouldHaveSquigglyError();
  await Editor.hover("}");
  await Hover.shouldHaveText("colon expected");
  await Editor.click("abc");
  await Editor.deleteCharactersLeft({ count: 4 });
  await Editor.shouldNotHaveSquigglyError();
  await Editor.type(" abc");
  await Editor.shouldHaveSquigglyError();
};
