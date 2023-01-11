import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("quick-pick-toggle");
});

afterAll(async () => {
  await runner.kill();
});

test("quick-pick-toggle", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
