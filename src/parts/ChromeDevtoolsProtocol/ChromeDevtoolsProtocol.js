// For more information on chrome devtools protocol, see https://github.com/aslushnikov/getting-started-with-cdp/blob/master/README.md

/**
 *
 * @param {import('@playwright/test').ElectronApplication} child
 * @returns
 */
export const connect = async (child) => {
  const page = await child.firstWindow();
  const session = await page.context().newCDPSession(page);
  return { page, session };
};
