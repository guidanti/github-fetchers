import { useWorker } from "jsr:@effection-contrib/worker@0.1.0";
import { resource } from "effection";
import { WorkerSend, TestContainers, TestContainer, WorkerRecv } from "./types.ts";
import { startDockerProxy } from "../docker-proxy.ts";

export function useTestContainers() {
  return resource<TestContainers>(function* (provide) {
    yield* startDockerProxy();

    const worker = yield* useWorker<WorkerSend, WorkerRecv, unknown, unknown>(
      new URL("./worker.ts", import.meta.url),
      {
        type: "module",
      },
    );

    try {
      yield* provide({
        *startMinio(options) {
  
          const message = yield* worker.send({
            type: "start",
            container: "minio",
            ...options,
          });
  
          const container = yield* resource<TestContainer>(function* (provide) {
            if (message.type === "started") {
              yield* provide({
                connectionUrl: message.connectionUrl,
                *stop() {
                  yield* worker.send({
                    type: "stop",
                    container: "minio",
                  });
                },
              });
            } else {
              throw new Error(`Was not expecteding ${message.type}`)
            }
          });
  
          return container;
        },
      });
    } finally {
      console.log("closing all containers (not implemented)");

    }
  });
}
