import { existsSync } from "node:fs";

const pathsToTry = [
  "/snap/code-insiders/current/usr/share/code-insiders/code-insiders",
  "/snap/code/current/usr/share/code/code",
];

export const getBinaryPath = () => {
  if (process.env.VSCODE_PATH) {
    return process.env.VSCODE_PATH;
  }
  for (const pathToTry of pathsToTry) {
    if (existsSync(pathToTry)) {
      return pathToTry;
    }
  }
  throw new Error("vscode binary path not found");
};
