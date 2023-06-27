import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const locations = [
  "lerna.json",
  "package-lock.json",
  "packages/cli/package-lock.json",
  "packages/e2e/package-lock.json",
  "packages/core/package-lock.json",
  "packages/page-object/package-lock.json",
  "packages/memory-leak-finder/package-lock.json",
  "packages/test-worker/package-lock.json",
  "packages/test-worker-commands/package-lock.json",
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
  "scripts/computeNodeModulesCacheKey.js",
  "packages/core/src/parts/VsCodeVersion/VsCodeVersion.js",
];

const getAbsolutePath = (relativePath) => {
  return join(root, relativePath);
};

const getContent = (absolutePath) => {
  return readFile(absolutePath, "utf8");
};

export const computeHash = (contents) => {
  const hash = createHash("sha1");
  if (Array.isArray(contents)) {
    for (const content of contents) {
      hash.update(content);
    }
  } else if (typeof contents === "string") {
    hash.update(contents);
  }
  return hash.digest("hex");
};

const computeCacheKey = async (locations) => {
  const absolutePaths = locations.map(getAbsolutePath);
  const contents = await Promise.all(absolutePaths.map(getContent));
  const hash = computeHash(contents);
  return hash;
};

const main = async () => {
  const hash = await computeCacheKey(locations);
  process.stdout.write(hash);
};

main();
