import _ from "lodash";
import { inspect } from "util";
import { getEventListenersForNode } from "../ChromeDevtoolsProtocol/getEventListenersForNode.js";

// get all dom nodes, even those inside open shadow roots. kind of like `querySelectorAll('*')`
export function getAllDomNodes() {
  const result = [];
  // @ts-ignore
  const stack = [...document.querySelectorAll("*")];

  let current;
  while ((current = stack.shift())) {
    if (current.shadowRoot) {
      stack.unshift(...current.shadowRoot.querySelectorAll("*"));
    }
    result.push(current);
  }

  return result;
}

/**
 *
 * @param {import('@playwright/test').CDPSession} cdpSession
 * @param {string} objectId
 * @returns
 */
const getDescriptors = async (cdpSession, objectId) => {
  // via https://stackoverflow.com/a/67030384
  const { result } = await cdpSession.send("Runtime.getProperties", {
    objectId,
  });

  const arrayProps = Object.fromEntries(result.map((_) => [_.name, _.value]));
  const length = arrayProps.length.value;
  const descriptors = [];

  for (let i = 0; i < length; i++) {
    descriptors.push(arrayProps[i]);
  }
  return descriptors;
};

// scrub the objects for external consumption, remove unnecessary stuff like objectId
const cleanNode = (node) => {
  return _.pick(node, ["className", "description"]);
};

const cleanListener = (listener) => ({
  // originalHandler seems to contain the same information as handler
  ..._.omit(listener, ["backendNodeId", "originalHandler"]),
  handler: _.omit(listener.handler, ["objectId"]),
});

/**
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').CDPSession} session
 */
export const run = async (page, session) => {
  const {
    result: { objectId },
  } = await session.send("Runtime.evaluate", {
    expression: `(function () {
      ${getAllDomNodes}
      return [...getAllDomNodes(), window, document]
    })()`,
  });

  const nodes = await getDescriptors(session, objectId);

  console.time("getEventListeners");
  const nodesWithListeners = await Promise.all(
    nodes.map(async (node) => {
      const listeners = await getEventListenersForNode(session, node);
      return {
        node,
        listeners,
      };
    })
  );

  // TODO measure leak dom nodes descriptions and leaked event listeners

  // console.timeEnd("getEventListeners");
  // console.log(JSON.stringify(nodesWithListenersActual, null, 2));
  // console.log({ nodesWithListeners });
  // expect(html).toContain(`<!-- Startup via workbench.js -->`);
};
