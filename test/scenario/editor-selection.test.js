import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-selection");
});

afterAll(async () => {
  await runner.kill();
});

test("editor-selection", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
