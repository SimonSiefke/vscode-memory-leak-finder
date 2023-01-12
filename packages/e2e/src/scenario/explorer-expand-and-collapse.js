export const beforeSetup = async ({ tmpDir, writeFile, mkdir, join }) => {
  await writeFile(join(tmpDir, `file-1.txt`), `file content 1`);
  await writeFile(join(tmpDir, `file-2.txt`), `file content 2`);
  await mkdir(join(tmpDir, `folder`));
  await writeFile(join(tmpDir, "folder", `file-3.txt`), `file content 3`);
  await writeFile(join(tmpDir, "folder", `file-4.txt`), `file content 4`);
};

export const run = async ({ page, expect, Explorer }) => {
  await Explorer.focus();
  const explorer = page.locator(".explorer-folders-view .monaco-list");
  const folder = explorer.locator(".monaco-list-row", { hasText: "folder" });
  await folder.click();
  const file3 = explorer.locator(".monaco-list-row", { hasText: "file-3.txt" });
  await expect(file3).toBeVisible();
  const file4 = explorer.locator(".monaco-list-row", { hasText: "file-4.txt" });
  await expect(file4).toBeVisible();
  await folder.click();
  await expect(file3).toBeHidden();
  await expect(file4).toBeHidden();
};
