import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("explorer-keyboard-navigation");
});

afterAll(async () => {
  await runner.kill();
});

test("explorer-keyboard-navigation", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
