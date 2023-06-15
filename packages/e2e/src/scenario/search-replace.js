export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, "file.txt"), "sample text");
};

export const setup = async ({ ActivityBar, Electron }) => {
  await ActivityBar.showSearch();
  await Electron.evaluate(`const electron = globalThis._VSCODE_NODE_MODULES["electron"];
  electron.dialog.showMessageBox = () => {
    return {
      response: 1,
    }
  }`);
};

export const run = async ({ Search }) => {
  await Search.type("sample");
  await Search.toHaveResults(["file.txt1", "sample text"]);
  await Search.typeReplace("other");
  await Search.replace();
  await Search.typeReplace("");
  await Search.type("other");
  await Search.toHaveResults(["file.txt1", "other text"]);
  await Search.typeReplace("sample");
  await Search.replace();
  await Search.typeReplace("");
};
