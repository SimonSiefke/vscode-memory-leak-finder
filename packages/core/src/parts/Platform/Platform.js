import * as DownloadAndUnzipVscode from "../DownloadAndUnzipVscode/DownloadAndUnzipVscode.js";
import * as VscodeVersion from "../VsCodeVersion/VsCodeVersion.js";

export const getBinaryPath = async () => {
  if (process.env.VSCODE_PATH) {
    return process.env.VSCODE_PATH;
  }
  const path = await DownloadAndUnzipVscode.downloadAndUnzipVscode(
    VscodeVersion.vscodeVersion
  );
  return path;
};

export const isWindows = () => {
  return process.platform === "win32";
};
