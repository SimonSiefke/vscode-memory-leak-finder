import { expect } from "@playwright/test";
import * as ChromeDevtoolsProtocol from "../ChromeDevtoolsProtocol/ChromeDevtoolsProtocol.js";
import { getEventListeners } from "../ChromeDevtoolsProtocol/getEventListeners.js";
import * as Electron from "../Electron/Electron.js";

const getScenario = (scenarioId) => {
  switch (scenarioId) {
    case "base":
      return import("../../scenario/base.js");
    case "toggle-quick-pick":
      return import("../../scenario/toggle-quick-pick.js");
    case "toggle-side-bar":
      return import("../../scenario/toggle-side-bar.js");
    case "toggle-panel":
      return import("../../scenario/toggle-panel.js");
    default:
      throw new Error(`unknown scenario ${scenarioId}`);
  }
};

export const runScenario = async (scenarioId) => {
  try {
    const child = await Electron.launch();
    const { page, session } = await ChromeDevtoolsProtocol.connect(child);
    await page.waitForLoadState("networkidle");
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
    const notification = page
      .locator("text=All installed extensions are temporarily disabled")
      .first();
    await expect(notification).toBeVisible();
    const results = [];
    const scenario = await getScenario(scenarioId);
    // warm up
    for (let i = 0; i < 1; i++) {
      await scenario.run(page);
    }
    for (let i = 0; i < 1; i++) {
      const beforeEventListeners = await getEventListeners(session);
      await scenario.run(page);
      const afterEventListeners = await getEventListeners(session);
      if (beforeEventListeners === afterEventListeners) {
        console.info(`event listener equal: ${beforeEventListeners}`);
      } else {
        console.info(
          `event listener increase: ${beforeEventListeners} -> ${afterEventListeners}`
        );
      }
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
