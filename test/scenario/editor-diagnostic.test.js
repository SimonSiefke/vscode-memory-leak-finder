import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-diagnostic");
});

afterAll(async () => {
  await runner.kill();
});

test("editor-diagnostic", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
