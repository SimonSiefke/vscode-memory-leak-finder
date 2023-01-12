export const beforeSetup = async ({
  tmpDir,
  userDataDir,
  writeFile,
  join,
  writeJson,
}) => {
  await writeFile(join(tmpDir, "file-1.txt"), ``);
  await writeFile(join(tmpDir, "file-2.txt"), ``);
  await writeFile(join(tmpDir, "file-3.txt"), ``);
  await writeJson(join(userDataDir, "User", "settings.json"), {
    "window.titleBarStyle": "custom",
  });
};

export const run = async ({ Explorer }) => {
  await Explorer.rename("file-2.txt", "renamed.txt");
  await Explorer.rename("renamed.txt", "file-2.txt");
};
