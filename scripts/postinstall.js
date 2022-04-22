import { downloadAndUnzipVSCode } from "@vscode/test-electron";
import { readFileSync } from "fs";
import { readdir, writeFile } from "fs/promises";
import { dirname, join } from "path";

const isWindows = () => {
  return process.platform === "win32";
};

const isLinux = () => {
  process.platform === "linux";
};

const isMacos = () => {};

const getPlatform = () => {
  switch (process.platform) {
    case "win32":
      return "windows";
    case "linux":
      return "linux";
    case "darwin":
      return "macos";
    default:
      throw new Error(`unsupported platform "${process.platform}"`);
  }
};

const getPackageJsonPath = (path) => {
  const platform = getPlatform();
  switch (platform) {
    case "linux":
      return join(dirname(path), "resources", "app", "package.json");
    case "macos":
      return join(dirname(dirname(path)), "Resources", "app", "package.json");
    case "windows":
      throw new Error("not yet supported");
  }
};

const main = async () => {
  const path = await downloadAndUnzipVSCode("1.66.2");
  const packageJsonPath = getPackageJsonPath(path);
  console.log({ packageJsonPath });
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
