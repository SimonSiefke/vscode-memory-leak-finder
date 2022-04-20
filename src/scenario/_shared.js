import { expect } from "@playwright/test";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";

const generateFileContent = () => {
  return Array(200).fill("sample text").join("\n");
};

const writeJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + "\n");
};
