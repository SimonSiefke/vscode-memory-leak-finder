import { expect } from "@playwright/test";

/**
 *
 * @param {import('@playwright/test').Page} page
 */
export const run = async (page) => {
  const html = await page.evaluate(() => {
    // @ts-ignore
    return document.body.innerHTML;
  });
  expect(html).toContain(`<!-- Startup via workbench.js -->`);
};
