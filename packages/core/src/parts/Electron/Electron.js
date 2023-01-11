import { _electron } from "@playwright/test";
import * as Platform from "../Platform/Platform.js";

export const launch = async ({ tmpDir, userDataDir }) => {
  const binaryPath = await Platform.getBinaryPath();
  const child = await _electron.launch({
    args: [
      "--wait",
      "--new-window",
      "--no-sandbox",
      "--disable-updates",
      "--skip-welcome",
      "--skip-release-notes",
      "--disable-workspace-trust",
      "--disable-extensions",
      "--user-data-dir",
      userDataDir,
      ".",
    ],
    cwd: tmpDir,
    executablePath: binaryPath,
  });
  return child;
};
