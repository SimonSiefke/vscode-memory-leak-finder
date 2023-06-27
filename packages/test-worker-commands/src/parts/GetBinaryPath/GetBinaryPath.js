import * as DownloadAndUnzipVscode from "../DownloadAndUnzipVscode/DownloadAndUnzipVscode.js";
import * as Process from "../Process/Process.js";
import * as VscodeVersion from "../VsCodeVersion/VsCodeVersion.js";

export const getBinaryPath = async () => {
  if (Process.env.VSCODE_PATH) {
    return Process.env.VSCODE_PATH;
  }
  const path = await DownloadAndUnzipVscode.downloadAndUnzipVscode(
    VscodeVersion.vscodeVersion
  );
};
