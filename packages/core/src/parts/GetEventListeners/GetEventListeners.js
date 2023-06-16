import * as CleanEventListenerDescription from "../CleanEventListenerDescription/CleanEventListenerDescription.js";
import * as DevtoolsProtocolDomDebugger from "../DevtoolsProtocolDomDebugger/DevtoolsProtocolDomDebugger.js";
import * as DevtoolsProtocolRuntime from "../DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js";
import * as PrototypeExpression from "../PrototypeExpression/PrototypeExpression.js";

const cleanEventListener = (eventListener) => {
  return {
    type: eventListener.type,
    lineNumber: eventListener.lineNumber,
    columnNumber: eventListener.columnNumber,
    description: CleanEventListenerDescription.cleanEventListenerDescription(
      eventListener.handler.description
    ),
    objectId: eventListener.handler.objectId,
  };
};

const isEnumerable = (property) => {
  return property.enumerable;
};

const getValue = (object) => {
  return object.value;
};

const getEventListenersFromMap = (listenerMap) => {
  return listenerMap.listeners;
};

/**
 * @param {import('@playwright/test').CDPSession} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const getEventListeners = async (session, objectGroup) => {
  // object group is required for function preview to work
  // see https://github.com/puppeteer/puppeteer/issues/3349#issuecomment-548428762
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.HtmlElement,
    includeCommandLineAPI: true,
    returnByValue: false,
    objectGroup,
  });
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    // @ts-ignore
    prototypeObjectId: prototype.objectId,
    objectGroup,
  });

  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objects.objects.objectId,
    ownProperties: true,
  });

  const fnResult5 = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: "window",
    returnByValue: false,
    objectGroup,
  });
  const fnResult6 = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: "document",
    returnByValue: false,
    objectGroup,
  });

  const domNodeDescriptors = fnResult1.filter(isEnumerable).map(getValue);
  const windowDescriptor = fnResult5;
  const documentDescriptor = fnResult6;
  const descriptors = [
    ...domNodeDescriptors,
    windowDescriptor,
    documentDescriptor,
  ];

  const getEventListenersOfDomNode = async (descriptor) => {
    const result = await DevtoolsProtocolDomDebugger.getEventListeners(
      session,
      {
        objectId: descriptor.objectId,
      }
    );
    return result;
  };

  const fnResult2 = await Promise.all(
    descriptors.map(getEventListenersOfDomNode)
  );

  // console.log({ fnResult2: fnResult2[1].listeners[0].handler })

  // console.log(JSON.stringify(fnResult2, null, 2))

  const eventListeners = fnResult2
    .flatMap(getEventListenersFromMap)
    .map(cleanEventListener);

  // await session.send('Runtime.releaseObjectGroup', {
  //   objectGroup,
  // })

  return eventListeners;
};
