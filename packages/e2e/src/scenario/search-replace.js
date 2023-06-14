export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, "file.txt"), "sample text");
};

export const setup = async ({ ActivityBar }) => {
  await ActivityBar.showSearch();
};

export const run = async ({ Search }) => {
  await Search.type("sample");
  await Search.toHaveResults(["file.txt1", "sample text"]);
  // await Search.deleteText();
  await Search.typeReplace("other");
  await Search.replace();
};
