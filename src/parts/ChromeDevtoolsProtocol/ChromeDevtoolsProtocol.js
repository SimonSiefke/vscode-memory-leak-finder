// For more information on chrome devtools protocol, see https://github.com/aslushnikov/getting-started-with-cdp/blob/master/README.md

import { WebSocket } from "ws";

export const connect = async (webSocketUrl) => {
  const webSocket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    webSocket.once("open", () => resolve());
    webSocket.once("error", (error) => {
      error.message = `Websocket Error: ${error.message}`;
      reject(error);
    });
  });
  webSocket.on("message", (message) => {
    const parsed = JSON.parse(message.toString());
    if (parsed.result) {
      callbacks[parsed.id].resolve(parsed.result);
    } else if (parsed.error) {
      callbacks[parsed.id].reject(parsed.error.message);
    }
  });
  const callbacks = Object.create(null);

  const invoke = (args) => {
    return new Promise((resolve, reject) => {
      callbacks[args.id] = { resolve, reject };
      webSocket.send(JSON.stringify(args));
    });
  };

  return {
    invoke,
  };
};
