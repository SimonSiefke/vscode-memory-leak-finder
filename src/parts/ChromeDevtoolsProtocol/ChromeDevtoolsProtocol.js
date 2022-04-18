// For more information on chrome devtools protocol, see https://github.com/aslushnikov/getting-started-with-cdp/blob/master/README.md

import { WebSocket } from "ws";

/**
 *
 * @param {import('@playwright/test').ElectronApplication} child
 * @returns
 */
export const connect = async (child) => {
  const page = await child.firstWindow();
  const session = await page.context().newCDPSession(page);

  const invoke = (args) => {
    return session.send(args.method, args.params);
  };

  return { page, session: { invoke } };
};
