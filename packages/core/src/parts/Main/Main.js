import { expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import * as PageObject from "page-object";
import VError from "verror";
import * as ChromeDevtoolsProtocol from "../ChromeDevtoolsProtocol/ChromeDevtoolsProtocol.js";
import { getEventListeners } from "../GetEventListeners/GetEventListeners.js";
import * as Electron from "../Electron/Electron.js";
import * as ImportScenario from "../ImportScenario/ImportScenario.js";
import * as TmpDir from "../TmpDir/TmpDir.js";

const writeJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + "\n");
};

export const runScenario = async (scenarioPath) => {
  const scenarioId = ``;
  try {
    const tmpDir = await TmpDir.create();
    const userDataDir = await TmpDir.create();
    const scenario = await ImportScenario.importScenario(scenarioPath);

    const beforeSetupContext = {
      tmpDir,
      userDataDir,
      writeFile,
      writeJson,
      join,
      mkdir,
    };
    // @ts-ignore
    if (scenario.beforeSetup) {
      // @ts-ignore
      await scenario.beforeSetup(beforeSetupContext);
    }
    const child = await Electron.launch({ tmpDir, userDataDir });
    const { page, session } = await ChromeDevtoolsProtocol.connect(child);
    await page.waitForLoadState("networkidle");
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible({
      timeout: 30_000,
    });
    const notification = page
      .locator("text=All installed extensions are temporarily disabled")
      .first();
    await expect(notification).toBeVisible({
      timeout: 15_000,
    });

    const utils = PageObject.create({ page, expect, VError });
    const setupContext = { page, tmpDir, userDataDir, expect, ...utils };
    const runContext = { page, expect, ...utils };
    // @ts-ignore
    if (scenario.setup) {
      // @ts-ignore
      await scenario.setup(setupContext);
    }
    // warm up
    for (let i = 0; i < 2; i++) {
      await scenario.run(runContext);
    }
    const results = [];
    for (let i = 0; i < 3; i++) {
      const beforeEventListeners = await getEventListeners(session);
      await scenario.run(runContext);
      const afterEventListeners = await getEventListeners(session);
      results.push({
        beforeEventListeners,
        afterEventListeners,
      });
    }
    if (
      results.every(
        (result) => result.beforeEventListeners < result.afterEventListeners
      )
    ) {
      for (const result of results) {
        console.info(
          `event listener increase: ${result.beforeEventListeners} -> ${result.afterEventListeners}`
        );
      }
    } else {
      console.info(`event listener equal: ${results[0].beforeEventListeners}`);
    }
    // console.info(`Scenario ${scenarioId} exited with code 0`);
    if (process.send) {
      process.exit(0);
    }
  } catch (error) {
    console.error(error);
    console.info(`Scenario ${scenarioId} exited with code 1`);
    if (process.send) {
      process.exit(1);
    }
  }

  // child.close();
};
