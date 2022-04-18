import { jest } from "@jest/globals";
import { fork } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import _kill from "tree-kill";
import waitForExpect from "wait-for-expect";

const kill = promisify(_kill);

waitForExpect.defaults.timeout = 35_000;
jest.setTimeout(35_000);

export const createRunner = (name) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const mainPath = join(__dirname, "..", "..", "src", `main.js`);
  const child = fork(mainPath, [], {
    stdio: "pipe",
    env: {
      ...process.env,
      HEADLESS: "1",
      SCENARIO: name,
    },
    execArgv: ["--unhandled-rejections=strict"],
    detached: true, // needs to be detached so child processes will be automatically killed when child is killed, see https://github.com/jasongilman/proto-repl/pull/292/files
  });

  let stdout = [];
  let stderr = [];
  const handleStdoutData = (data) => {
    console.log({ stdout: data.toString() });
    stdout.push(data.toString());
  };

  // @ts-ignore
  child.stdout.on("data", handleStdoutData);
  const handleStdErrData = (data) => {
    stderr.push(data.toString());
    console.log({ stderr: data.toString() });
  };
  // @ts-ignore
  child.stderr.on("data", handleStdErrData);

  let killed = false;

  child.on("close", () => {
    killed = true;
  });

  let isSucceeded = false;
  let isRejected = false;
  let succeededCallback = () => {};
  let rejectedCallback = (error) => {};

  child.on("message", (message) => {
    console.info({ message });
    if (message === "succeeded") {
      isSucceeded = true;
      succeededCallback();
    }
  });

  child.on("exit", (code) => {
    if (code === 0) {
      isSucceeded = true;
      succeededCallback();
    } else {
      isRejected = true;
      rejectedCallback(new Error(`runner exited with code ${code}`));
    }
  });

  return {
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
    async kill() {
      if (killed) {
        console.log("already killed");
        return;
      }
      try {
        // @ts-ignore
        await kill(child.pid, "SIGKILL");
      } catch (error) {
        console.info("[info] runner could not be killed", error);
      }
    },
    waitForSucceeded() {
      return new Promise((resolve, reject) => {
        if (isSucceeded) {
          resolve();
          return;
        }
        if (isRejected) {
          reject();
          return;
        }
        // @ts-ignore
        succeededCallback = resolve;
        rejectedCallback = reject;
      });
    },
  };
};
