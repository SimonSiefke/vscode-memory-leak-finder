import * as Platform from "../Platform/Platform.js";
import * as TmpDir from "../TmpDir/TmpDir.js";
import { spawn } from "node:child_process";

const getWebSocketUrl = (data) => {
  return data.trim().slice("DevTools listening on ".length);
};

export const launch = async () => {
  const tmpDir = await TmpDir.create();
  const binaryPath = Platform.getBinaryPath();
  const args = ["--wait", "--remote-debugging-port=0", tmpDir];
  const child = spawn(binaryPath, args, {
    stdio: "pipe",
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: undefined,
    },
  });
  child.stdout.on("data", (data) => {
    process.stdout.write(data);
  });
  child.stderr.on("data", (data) => {
    process.stderr.write(data);
  });

  process.on("beforeExit", () => {
    child.kill();
  });

  const line = await new Promise((resolve, reject) => {
    child.stderr.once("data", (data) => {
      if (data.toString().includes("DevTools listening on ws")) {
        resolve(data.toString());
      } else {
        reject(new Error("expected websocket url"));
      }
    });
  });
  const webSocketUrl = getWebSocketUrl(line);
  return webSocketUrl;
};
