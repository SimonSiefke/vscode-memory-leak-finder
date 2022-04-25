import { _electron } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { join } from "path";
import * as Platform from "../Platform/Platform.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const launch = async ({ tmpDir, userDataDir }) => {
  const videoFolder = join(
    __dirname,
    "..",
    "..",
    "..",
    ".videos",
    "raw-videos"
  );
  if (Platform.recordVideos()) {
    await mkdir(videoFolder, { recursive: true });
  }
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
    recordVideo: Platform.recordVideos()
      ? {
          dir: videoFolder,
        }
      : undefined,
  });
  return child;
};
