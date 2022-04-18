import { expect } from "@playwright/test";

export const run = async (connection) => {
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
