import { downloadAndUnzipVSCode } from "@vscode/test-electron";
// import { existsSync } from "node:fs";

// const pathsToTry = [
//   "/snap/code-insiders/current/usr/share/code-insiders/code-insiders",
//   "/snap/code/current/usr/share/code/code",
// ];

export const getBinaryPath = async () => {
  if (process.env.VSCODE_PATH) {
    return process.env.VSCODE_PATH;
  }
  const path = await downloadAndUnzipVSCode("1.69.0");
  return path;
};
