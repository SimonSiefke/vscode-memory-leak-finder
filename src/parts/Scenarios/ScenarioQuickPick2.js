import { expect } from "@playwright/test";
import { getHtmlElements } from "../ChromeDevtoolsProtocol/ChromeDevtoolsProtocol.js";

/**
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').CDPSession} session
 */
export const run = async (page, session) => {
  // TODO
  // 1. count number of dom nodes or objects
  // 2. open quickpick
  // 3. count number of dom nodes or objects
  // 4. close quickpick
  // 5. count number of dom nodes or objects
  // if number of dom nodes has increased, there is a memory leak
  const htmlElementsBefore = await getHtmlElements(session);

  await page.keyboard.press("Control+Shift+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const htmlElementsMiddle = await getHtmlElements(session);

  await page.keyboard.press("Escape");
  await expect(quickPick).toBeHidden();
  const htmlElementsAfter = await getHtmlElements(session);

  console.log({ htmlElementsBefore, htmlElementsMiddle, htmlElementsAfter });
};
