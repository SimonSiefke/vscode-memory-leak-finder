import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const root = path.join(__dirname, "../../../../");

const extensionPath = join(
  root,
  "packages",
  "e2e",
  "fixtures",
  "sample.status-bar-item"
);

export const extraLaunchArgs = [`--extensionDevelopmentPath=${extensionPath}`];

export const run = async ({ StatusBar }) => {
  StatusBar.click("0, Counter");
  StatusBar.click("1, Counter");
  StatusBar.click("2, Counter");
  StatusBar.click("1, Counter");
};
