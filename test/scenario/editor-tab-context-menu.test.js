import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-tab-context-menu");
});

afterAll(async () => {
  await runner.kill();
});

test("editor-tab-context-menu", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
