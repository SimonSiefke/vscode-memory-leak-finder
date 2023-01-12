export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, "index.html"), "test");
};

export const setup = async ({ Editor }) => {
  await Editor.open("index.html", { hasText: "test" });
};

export const run = async ({ Suggest }) => {
  await Suggest.open();
  await Suggest.close();
};
