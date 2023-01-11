import * as Root from "../Root/Root.js";

export const downloadAndUnzipVscode = async (vscodeVersion) => {
  if (process.env.VSCODE_PATH) {
    return process.env.VSCODE_PATH;
  }
  // workaround for vscode-test downloading files to process.cwd
  const cwd = process.cwd();
  process.chdir(Root.root);
  const { downloadAndUnzipVSCode } = await import("@vscode/test-electron");
  const path = await downloadAndUnzipVSCode(vscodeVersion);
  process.chdir(cwd);
  return path;
};
