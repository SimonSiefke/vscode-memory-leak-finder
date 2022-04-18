import * as Id from "../Id/Id.js";

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
  console.log({ expressionResult });
};
