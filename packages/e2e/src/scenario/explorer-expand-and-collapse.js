export const beforeSetup = async ({ tmpDir, writeFile, mkdir, join }) => {
  await writeFile(join(tmpDir, `file-1.txt`), `file content 1`);
  await writeFile(join(tmpDir, `file-2.txt`), `file content 2`);
  await mkdir(join(tmpDir, `folder`));
  await writeFile(join(tmpDir, "folder", `file-3.txt`), `file content 3`);
  await writeFile(join(tmpDir, "folder", `file-4.txt`), `file content 4`);
};

export const run = async ({ Explorer }) => {
  await Explorer.focus();
  await Explorer.expand("folder");
  await Explorer.toHaveItem("file-3.txt");
  await Explorer.toHaveItem("file-4.txt");
  await Explorer.collapse("folder");
  await Explorer.not.toHaveItem("file-3.txt");
  await Explorer.not.toHaveItem("file-4.txt");
};
