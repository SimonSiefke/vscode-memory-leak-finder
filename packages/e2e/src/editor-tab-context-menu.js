const generateFileContent = () => {
  return Array(200).fill("sample text").join("\n");
};

export const beforeSetup = async ({
  tmpDir,
  userDataDir,
  writeFile,
  join,
  writeJson,
}) => {
  await writeJson(join(userDataDir, "User", "settings.json"), {
    "window.titleBarStyle": "custom",
  });
  await writeFile(join(tmpDir, "file.txt"), generateFileContent());
};

export const setup = async ({ Editor }) => {
  await Editor.open("file.txt");
};

export const run = async ({ Tab, ContextMenu }) => {
  await Tab.openContextMenu("file.txt");
  await ContextMenu.close();
};
