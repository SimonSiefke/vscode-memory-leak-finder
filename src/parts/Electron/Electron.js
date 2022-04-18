import { _electron } from "@playwright/test";
import * as Platform from "../Platform/Platform.js";
import * as TmpDir from "../TmpDir/TmpDir.js";

export const launch = async () => {
  const tmpDir = await TmpDir.create();
  const binaryPath = Platform.getBinaryPath();
  const child = await _electron.launch({
    args: ["--wait", "--new-window", "."],
    cwd: tmpDir,
    executablePath: binaryPath,
  });
  return child;
};
