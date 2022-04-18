import * as Platform from "../Platform/Platform.js";
import * as TmpDir from "../TmpDir/TmpDir.js";
import { spawn } from "node:child_process";
import pTimeout from "p-timeout";

const getWebSocketUrl = (data) => {
  return data.trim().slice("DevTools listening on ".length);
};

export const launch = async () => {
  const tmpDir = await TmpDir.create();
  const binaryPath = Platform.getBinaryPath();
  const args = [
    "--wait",
    "--remote-debugging-port=0",
    "--wait",
    "--new-window",
    ".",
  ];
  const child = spawn(binaryPath, args, {
    cwd: tmpDir,
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

  process.on("uncaughtExceptionMonitor", () => {
    child.kill();
  });

  process.on("SIGHUP", () => {
    child.kill();
  });

  const linePromise = new Promise((resolve, reject) => {
    const handleData = (data) => {
      console.log({ data: data.toString() });
      if (data.toString().includes("DevTools listening on ws")) {
        child.stderr.off("data", handleData);
        resolve(data.toString());
      }
    };
    child.stderr.on("data", handleData);
  });
  const line = await pTimeout(linePromise, 1750);
  const webSocketUrl = getWebSocketUrl(line);
  return webSocketUrl;
};
