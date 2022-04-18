import { expect } from "@playwright/test";

export const run = async (connection) => {
  // TODO
  // 1. count number of dom nodes or objects
  // 2. open quickpick
  // 3. count number of dom nodes or objects
  // 4. close quickpick
  // 5. count number of dom nodes or objects
  // if number of dom nodes has increased, there is a memory leak
  const expressionResult = await connection.invoke({
    method: "Runtime.evaluate",
    params: {
      expression: "document.body.innerHTML",
      returnByValue: true,
    },
  });
  expect(expressionResult.result.value).toContain(
    `<!-- Startup via workbench.js -->`
  );
};
