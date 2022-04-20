import { expect } from "@playwright/test";
import * as ChromeDevtoolsProtocol from "../ChromeDevtoolsProtocol/ChromeDevtoolsProtocol.js";
import { getEventListeners } from "../ChromeDevtoolsProtocol/getEventListeners.js";
import * as Electron from "../Electron/Electron.js";
import * as TmpDir from "../TmpDir/TmpDir.js";

const getScenario = (scenarioId) => {
  switch (scenarioId) {
    case "base":
      return import("../../scenario/base.js");
    case "quick-pick-toggle":
      return import("../../scenario/quick-pick-toggle.js");
    case "toggle-side-bar":
      return import("../../scenario/toggle-side-bar.js");
    case "toggle-panel":
      return import("../../scenario/toggle-panel.js");
    case "toggle-activity-bar":
      return import("../../scenario/toggle-activity-bar.js");
    case "editor-open":
      return import("../../scenario/editor-open.js");
    case "editor-type":
      return import("../../scenario/editor-type.js");
    case "editor-scrolling":
      return import("../../scenario/editor-scrolling.js");
    case "editor-tab-context-menu":
      return import("../../scenario/editor-tab-context-menu.js");
    case "explorer-keyboard-navigation":
      return import("../../scenario/explorer-keyboard-navigation.js");
    case "quick-pick-color-theme":
      return import("../../scenario/quick-pick-color-theme.js");
    case "editor-completion-toggle":
      return import("../../scenario/editor-completion-toggle.js");
    case "editor-hover-toggle":
      return import("../../scenario/editor-hover-toggle.js");
    case "editor-split":
      return import("../../scenario/editor-split.js");
    case "editor-rename":
      return import("../../scenario/editor-rename.js");
    default:
      throw new Error(`unknown scenario ${scenarioId}`);
  }
};

export const runScenario = async (scenarioId) => {
  try {
    const tmpDir = await TmpDir.create();
    const userDataDir = await TmpDir.create();
    const scenario = await getScenario(scenarioId);

    // @ts-ignore
    if (scenario.beforeSetup) {
      // @ts-ignore
      scenario.beforeSetup({ tmpDir, userDataDir });
    }
    const child = await Electron.launch({ tmpDir, userDataDir });
    const { page, session } = await ChromeDevtoolsProtocol.connect(child);
    await page.waitForLoadState("networkidle");
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
    const notification = page
      .locator("text=All installed extensions are temporarily disabled")
      .first();
    await expect(notification).toBeVisible();
    const results = [];

    // @ts-ignore
    if (scenario.setup) {
      // @ts-ignore
      await scenario.setup({ page, tmpDir, userDataDir });
    }
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
