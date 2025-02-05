import { useWorker } from "jsr:@effection-contrib/worker@0.1.0";
import { resource } from "effection";
import {
  TestContainer,
  TestContainers,
  WorkerRecv,
  WorkerSend,
} from "./types.ts";
import { startDockerProxy } from "../docker-proxy.ts";

export function useTestContainers(options?: { debug: boolean }) {
  return resource<TestContainers>(function* (provide) {
    yield* startDockerProxy();

    if (options?.debug) {
      Deno.env.set("DEBUG", "testcontainers*");
    }

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
                *copy({ files, directories }) {
                  if (!files?.length && !directories?.length) {
                    throw new Error(
                      `Must provides either files or directories to copy to the container`,
                    );
                  }
                  yield* worker.send({
                    type: "copy",
                    container: "minio",
                    files,
                    directories,
                  });
                },
                *getPorts() {
                  const response = yield* worker.send({
                    type: "getPorts",
                    container: "minio",
                  });

                  if (response.type === "ports") {
                    return { api: response.api, ui: response.ui };
                  }

                  throw new Error(`Expected "ports" got ${response.type}`);
                },
                *getHost() {
                  const response = yield* worker.send({
                    type: "getHost",
                    container: "minio",
                  });

                  if (response.type === "host") {
                    return response.host;
                  }

                  throw new Error(`Expected "host" got ${response.type}`);
                },
                *exec(command, options = {}) {
                  const response = yield* worker.send({
                    type: "exec",
                    container: "minio",
                    command,
                    options,
                  });

                  if (response.type === "execResult") {
                    return response;
                  }

                  throw new Error(`Expected "execResult" got ${response.type}`);
                },
              });
            } else {
              throw new Error(`Was not expecteding ${message.type}`);
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
