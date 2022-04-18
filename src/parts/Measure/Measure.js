import { getHtmlElements } from "../ChromeDevtoolsProtocol/ChromeDevtoolsProtocol.js";

/**
 *
 * @param {import('@playwright/test').CDPSession} session
 * @returns
 */
export const measureNumberOfHtmlElements = async (session) => {
  const htmlElements = await getHtmlElements(session);
  return htmlElements;
};
