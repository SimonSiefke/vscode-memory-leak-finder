export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, "index.html"), "<h1>hello world</h1>");
};

export const setup = async ({ Editor }) => {
  await Editor.open("index.html");
};

export const run = async ({ Editor }) => {
  await Editor.click("h1");
  await Editor.goToDefinition("No definition found for 'h1'");
  await Editor.shouldHaveOverlayMessage();
};
