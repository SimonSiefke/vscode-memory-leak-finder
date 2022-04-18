import * as Electron from "../Electron/Electron.js";
import * as ChromeDevtoolsProtocol from "../ChromeDevtoolsProtocol/ChromeDevtoolsProtocol.js";
import * as Id from "../Id/Id.js";
import * as Assert from "../Assert/Assert.js";

const getScenario = (scenarioId) => {
  switch (scenarioId) {
    case "Base":
      return import("../Scenarios/ScenarioBase.js");
    default:
      throw new Error(`unknown scenario ${scenarioId}`);
  }
};

const getTargets = async (webSocket) => {
  const start = Date.now();
  let current = Date.now();
  while (current - start < 7000) {
    current = Date.now();
    const targets = await webSocket.invoke({
      id: Id.create(),
      method: "Target.getTargets",
    });
    if (targets.targetInfos.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      continue;
    }
    return targets;
  }
  throw new Error("no targets found");
};

export const runScenario = async (scenarioId) => {
  const webSocketUrl = await Electron.launch();
  const webSocket = await ChromeDevtoolsProtocol.connect(webSocketUrl);

  const targets = await getTargets(webSocket);
  console.log(JSON.stringify(targets));
  const pageTarget = targets.targetInfos.find((info) => info.type === "page");
  Assert.object(pageTarget);

  const session = await webSocket.invoke({
    id: Id.create(),
    method: "Target.attachToTarget",
    params: {
      targetId: pageTarget.targetId,
      flatten: true,
    },
  });

  Assert.object(session);
  const sessionId = session.sessionId;
  Assert.string(sessionId);

  const scenario = await getScenario(scenarioId);
  await scenario.run({
    sessionId,
    webSocket,
  });
};
