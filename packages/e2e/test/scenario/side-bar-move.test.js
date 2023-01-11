import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("side-bar-move");
});

afterAll(async () => {
  await runner.kill();
});

test("side-bar-move", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
