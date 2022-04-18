import { downloadAndUnzipVSCode } from "@vscode/test-electron";
import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { dirname, join } from "path";

const main = async () => {
  const path = await downloadAndUnzipVSCode("1.66.2");
  const packageJsonPath = join(
    dirname(path),
    "resources",
    "app",
    "package.json"
  );
  const originalContent = readFileSync(packageJsonPath, "utf-8");
  const originalParsed = JSON.parse(originalContent);
  const newParsed = {
    ...originalParsed,
    name: "Code-Test",
  };
  const newContent = JSON.stringify(newParsed, null, 2) + "\n";
  await writeFile(packageJsonPath, newContent);
};

main();
