import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("sample.toggle-mini-map");
});

afterAll(async () => {
  await runner.kill();
});

test("sample.toggle-mini-map", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
