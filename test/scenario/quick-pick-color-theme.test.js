import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("quick-pick-color-theme");
});

afterAll(async () => {
  await runner.kill();
});

test("quick-pick-color-theme", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
