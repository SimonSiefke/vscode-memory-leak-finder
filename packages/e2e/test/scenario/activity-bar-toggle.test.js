import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("activity-bar-toggle-view");
});

afterAll(async () => {
  await runner.kill();
});

test("activity-bar-toggle-view", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
