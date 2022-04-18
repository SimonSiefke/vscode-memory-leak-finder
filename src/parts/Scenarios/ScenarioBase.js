import * as Id from "../Id/Id.js";
import { expect } from "@playwright/test";

export const run = async ({ webSocket, sessionId }) => {
  const expressionResult = await webSocket.invoke({
    id: Id.create(),
    method: "Runtime.evaluate",
    sessionId,
    params: {
      expression: "document.body.innerHTML",
      returnByValue: true,
    },
  });
  expect(expressionResult.result.value).toContain(
    `<!-- Startup via workbench.js -->`
  );
};
