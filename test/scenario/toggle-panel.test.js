import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("toggle-panel");
});

afterAll(async () => {
  await runner.kill();
});

test("toggle-panel", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContain(`event listener equal: 977\n`);
});
