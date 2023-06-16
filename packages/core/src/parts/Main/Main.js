import { expect } from "@playwright/test";
import { Measures } from "@vscode-memory-leak-finder/memory-leak-finder";
import * as PageObject from "@vscode-memory-leak-finder/page-object";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import VError from "verror";
import * as ChromeDevtoolsProtocol from "../ChromeDevtoolsProtocol/ChromeDevtoolsProtocol.js";
import * as Electron from "../Electron/Electron.js";
import * as ImportScenario from "../ImportScenario/ImportScenario.js";
import * as Process from "../Process/Process.js";
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
    const extraLaunchArgs = scenario.extraLaunchArgs || [];
    const child = await Electron.launch({
      tmpDir,
      userDataDir,
      extraLaunchArgs,
    });
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

    const utils = PageObject.create({ page, expect, VError, child });
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
    const measureFactory = Measures.MeasureEventListenerCount;
    const measure = measureFactory.create(session);
    for (let i = 0; i < 3; i++) {
      const before = await measure.start();
      await scenario.run(runContext);
      const after = await measure.stop();
      const result = measure.compare(before, after);
      results.push(result);
    }
    if (results.every((result) => result.before < result.after)) {
      for (const result of results) {
        console.info(
          `event listener increase: ${result.before} -> ${result.after}`
        );
      }
    } else {
      console.info(`event listener equal: ${results[0].before}`);
    }
    // console.info(`Scenario ${scenarioId} exited with code 0`);
    if (Process.send) {
      Process.exit(0);
    }
  } catch (error) {
    console.error(error);
    console.info(`Scenario ${scenarioId} exited with code 1`);
    if (Process.send) {
      Process.exit(1);
    }
  }

  // child.close();
};
