import * as Root from "../Root/Root.js";
import * as Process from "../Process/Process.js";

export const downloadAndUnzipVscode = async (vscodeVersion) => {
  if (Process.env.VSCODE_PATH) {
    return Process.env.VSCODE_PATH;
  }
  // workaround for vscode-test downloading files to process.cwd
  const cwd = process.cwd();
  Process.chdir(Root.root);
  const { downloadAndUnzipVSCode } = await import("@vscode/test-electron");
  const path = await downloadAndUnzipVSCode(vscodeVersion);
  Process.chdir(cwd);
  return path;
};
