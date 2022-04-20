import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-definition-no-definition-found");
});

afterAll(async () => {
  await runner.kill();
});

test("editor-definition-no-definition-found", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
