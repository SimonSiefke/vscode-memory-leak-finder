import { _electron } from "@playwright/test";
import * as GetBinaryPath from "../GetBinaryPath/GetBinaryPath.js";
import * as GetVsCodeArgs from "../GetVsCodeArgs/GetVsCodeArgs.js";

export const launch = async ({ tmpDir, userDataDir, extraLaunchArgs }) => {
  const binaryPath = await GetBinaryPath.getBinaryPath();
  const args = GetVsCodeArgs.getVscodeArgs({ userDataDir, extraLaunchArgs });
  const child = await _electron.launch({
    args,
    cwd: tmpDir,
    executablePath: binaryPath,
  });
  return child;
};
